import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

/** 创建订阅订单 */
router.post('/create', requireAuth, async (req, res) => {
  const { plan } = req.body
  // TODO: 调用微信支付/支付宝创建预订单
  // const wxPayArgs = await createWxPayOrder({ uid: req.user.uid, plan })
  res.json({
    code: 0,
    data: {
      orderId: 'mock_' + Date.now(),
      payArgs: { /* 微信支付参数 */ }
    }
  })
})

/** 支付回调（来自微信/支付宝服务器，无需 token） */
router.post('/callback/wechat', async (req, res) => {
  // TODO: 验证签名 + 更新订单 + 开通会员
  res.send('SUCCESS')
})

export default router
