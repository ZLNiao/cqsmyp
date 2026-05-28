import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getWechatPay } from '../services/wechat-pay.js'
import { setUserVip } from '../services/user.js'
import { query } from '../services/db.js'
import { getPlan, generateOrderNo } from '../utils/plans.js'
import { verifyReceipt, findLatestTransaction, PRODUCT_ID_MAP } from '../services/apple-iap.js'
import logger from '../utils/logger.js'

const router = Router()

/**
 * POST /api/order/create
 * 创建订阅订单 + 调起微信支付
 * body: { plan: 'month' | 'quarter' | 'year' }
 * 返回: { orderId, payArgs }  ← 前端用 payArgs 调 uni.requestPayment
 */
router.post('/create', requireAuth, async (req, res, next) => {
  try {
    const { plan: planKey } = req.body
    const plan = getPlan(planKey)
    if (!plan) return res.status(400).json({ code: 400, message: '无效套餐' })

    const wxPay = getWechatPay()

    // 未配置微信支付 → 开发环境直接 mock 开通会员
    if (!wxPay) {
      logger.warn('微信支付未配置，开发环境直接开通会员')
      const expiry = await setUserVip(req.user.uid, plan.days)
      return res.json({
        code: 0,
        data: { mock: true, expiry, message: '开发环境模拟支付成功' }
      })
    }

    const orderNo = generateOrderNo()

    // 1. 写订单（pending）
    await query(
      `INSERT INTO orders (order_no, user_id, plan, amount, status, pay_method)
       VALUES (?, ?, ?, ?, 'pending', 'wechat')`,
      [orderNo, req.user.uid, planKey, plan.price / 100]
    )

    // 2. 调用微信下单
    const { prepay_id } = await wxPay.createAppOrder({
      outTradeNo: orderNo,
      description: `GlamUp ${plan.label}`,
      amount: plan.price
    })

    // 3. 二次签名（前端调起支付的参数）
    const payArgs = wxPay.signAppPayParams(prepay_id)

    res.json({ code: 0, data: { orderId: orderNo, payArgs } })
  } catch (e) {
    logger.error('创建订单失败:', e.message)
    next(e)
  }
})

/**
 * POST /api/order/callback/wechat
 * 微信支付异步通知（无需 token，由微信服务器调用）
 * 入口处已安装 express.raw()，req.body 是 Buffer
 */
router.post('/callback/wechat', async (req, res) => {
    try {
      const wxPay = getWechatPay()
      if (!wxPay) return res.status(500).json({ code: 'FAIL', message: 'wxpay not configured' })

      const timestamp = req.headers['wechatpay-timestamp']
      const nonce = req.headers['wechatpay-nonce']
      const signature = req.headers['wechatpay-signature']
      const body = req.body.toString('utf8')

      // 1. 验签
      const valid = wxPay.verifyNotify({ timestamp, nonce, body, signature })
      if (!valid) {
        logger.warn('微信回调验签失败')
        return res.status(401).json({ code: 'FAIL', message: 'sign error' })
      }

      const data = JSON.parse(body)

      // 2. 解密
      const decrypted = wxPay.decryptResource({
        ciphertext: data.resource.ciphertext,
        nonce: data.resource.nonce,
        associatedData: data.resource.associated_data
      })

      logger.info(`微信回调：${decrypted.out_trade_no} ${decrypted.trade_state}`)

      // 3. 处理（仅成功状态）
      if (decrypted.trade_state === 'SUCCESS') {
        const orderNo = decrypted.out_trade_no
        const transactionId = decrypted.transaction_id

        const orders = await query(
          'SELECT * FROM orders WHERE order_no = ? LIMIT 1',
          [orderNo]
        )
        const order = orders[0]
        if (!order) {
          return res.status(200).json({ code: 'SUCCESS', message: 'order not found, ignored' })
        }

        // 幂等：已支付直接返回成功
        if (order.status === 'paid') {
          return res.json({ code: 'SUCCESS', message: 'duplicate, ignored' })
        }

        // 更新订单 + 开通会员
        await query(
          `UPDATE orders SET status = 'paid', transaction_id = ?, paid_at = NOW()
           WHERE order_no = ? AND status = 'pending'`,
          [transactionId, orderNo]
        )
        const plan = getPlan(order.plan)
        await setUserVip(order.user_id, plan.days)

        logger.info(`订单 ${orderNo} 支付成功，用户 ${order.user_id} 开通 ${plan.label}`)
      }

      res.json({ code: 'SUCCESS', message: 'OK' })
    } catch (e) {
      logger.error('回调处理失败:', e)
      // 微信看到非 200 会重试，这里如果是程序 bug 应该返回非 SUCCESS 让其重试
      res.status(500).json({ code: 'FAIL', message: e.message })
    }
  })

/**
 * GET /api/order/status/:orderNo
 * 查询订单状态（前端支付完成后轮询用）
 */
router.get('/status/:orderNo', requireAuth, async (req, res, next) => {
  try {
    const orders = await query(
      'SELECT order_no, plan, amount, status, paid_at FROM orders WHERE order_no = ? AND user_id = ? LIMIT 1',
      [req.params.orderNo, req.user.uid]
    )
    if (orders.length === 0) {
      return res.status(404).json({ code: 404, message: '订单不存在' })
    }
    res.json({ code: 0, data: orders[0] })
  } catch (e) {
    next(e)
  }
})

// =============================================================
// Apple In-App Purchase
// =============================================================

/**
 * POST /api/order/iap/verify
 * iOS 端订阅成功后，将 receipt 发到这里验证
 *
 * Body: { receiptData, productId }
 * Returns: { orderNo, transactionId, expiresDate }
 */
router.post('/iap/verify', requireAuth, async (req, res, next) => {
  try {
    const { receiptData, productId } = req.body
    if (!receiptData || !productId) {
      return res.status(400).json({ code: 400, message: '缺少 receiptData 或 productId' })
    }

    const planKey = PRODUCT_ID_MAP[productId]
    if (!planKey) {
      return res.status(400).json({ code: 400, message: '未知的产品 ID' })
    }
    const plan = getPlan(planKey)

    // 1. 调 Apple 验证
    const verifyResult = await verifyReceipt(receiptData)

    // 2. 找到该产品的最新交易
    const tx = findLatestTransaction(verifyResult, productId)
    if (!tx) {
      return res.status(400).json({ code: 400, message: '未找到该产品的购买记录' })
    }

    // 3. 检查未过期 / 未取消
    if (tx.cancellationDate) {
      return res.status(400).json({ code: 400, message: '订阅已被取消' })
    }
    if (tx.expiresDateMs && tx.expiresDateMs < Date.now()) {
      return res.status(400).json({ code: 400, message: '订阅已过期' })
    }

    // 4. 幂等：transaction_id 已处理过
    const existing = await query(
      'SELECT id, order_no FROM orders WHERE transaction_id = ? LIMIT 1',
      [tx.transactionId]
    )
    if (existing.length > 0) {
      return res.json({
        code: 0,
        data: { orderNo: existing[0].order_no, transactionId: tx.transactionId, duplicate: true }
      })
    }

    // 5. 写订单
    const orderNo = generateOrderNo()
    await query(
      `INSERT INTO orders (order_no, user_id, plan, amount, status, pay_method, transaction_id, paid_at)
       VALUES (?, ?, ?, ?, 'paid', 'apple_iap', ?, NOW())`,
      [orderNo, req.user.uid, planKey, plan.price / 100, tx.transactionId]
    )

    // 6. 开通会员（用 Apple 返回的真实过期时间，更准确）
    if (tx.expiresDateMs) {
      // 用 Apple 给的真实过期日
      await query(
        'UPDATE users SET is_vip = 1, vip_expiry = FROM_UNIXTIME(?) WHERE id = ?',
        [Math.floor(tx.expiresDateMs / 1000), req.user.uid]
      )
    } else {
      // 没有过期日（可能是非订阅）→ 按套餐天数加
      await setUserVip(req.user.uid, plan.days)
    }

    logger.info(`[IAP] user=${req.user.uid} product=${productId} tx=${tx.transactionId}`)

    res.json({
      code: 0,
      data: {
        orderNo,
        transactionId: tx.transactionId,
        expiresDate: tx.expiresDateMs ? new Date(tx.expiresDateMs).toISOString() : null
      }
    })
  } catch (e) {
    logger.error('IAP 验证失败:', e.message)
    next(e)
  }
})

/**
 * POST /api/order/iap/notification
 * App Store Server Notifications V2（订阅续订通知）
 *
 * 用于处理：自动续订、退款、订阅恢复等
 * 配置：App Store Connect → 你的 App → 应用信息 → App Store Server Notifications → URL
 *
 * 此处仅做最小处理：续订成功时延长会员到期日
 * 完整版需要验证 JWS 签名（StoreKit 2），生产环境请用 @apple/app-store-server-library
 */
router.post('/iap/notification', async (req, res) => {
  try {
    const payload = req.body
    logger.info('[IAP Notification] 收到通知', payload?.notificationType)

    // 简化版：直接信任并处理（生产环境必须验签）
    // 真实数据在 payload.signedPayload 中（JWS 格式）

    // TODO: 用 @apple/app-store-server-library 验签 + 解析
    // const lib = new AppStoreServerLibrary({ ... })
    // const decoded = await lib.verifyAndDecodeSignedPayload(payload.signedPayload)

    // 续订成功（DID_RENEW）：找到 originalTransactionId 对应的用户，延长 vip_expiry
    // 退款（REFUND）：取消用户的 VIP

    // 微信回调一样要返回 200
    res.status(200).json({ ok: true })
  } catch (e) {
    logger.error('IAP 通知处理失败:', e)
    res.status(500).json({ error: e.message })
  }
})

export default router
