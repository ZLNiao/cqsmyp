/**
 * Apple In-App Purchase 收据验证
 * 文档：https://developer.apple.com/documentation/appstorereceipts/verifyreceipt
 *
 * 流程：
 *  1. 先用生产 URL 验证
 *  2. 如返回 21007（沙箱收据），改用沙箱 URL
 *  3. 检查 status 必须为 0
 *  4. 从 latest_receipt_info 中找到 product_id 对应的最新交易
 */
import axios from 'axios'
import logger from '../utils/logger.js'

const PROD_URL = 'https://buy.itunes.apple.com/verifyReceipt'
const SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt'

/** 产品 ID → 后端套餐 key 映射（必须与 App Store Connect 配置一致） */
export const PRODUCT_ID_MAP = {
  'com.zlniao.glamup.subscription.month': 'month',
  'com.zlniao.glamup.subscription.quarter': 'quarter',
  'com.zlniao.glamup.subscription.year': 'year'
}

/** 反向映射：套餐 → 产品 ID（前端用） */
export const PLAN_TO_PRODUCT_ID = Object.fromEntries(
  Object.entries(PRODUCT_ID_MAP).map(([k, v]) => [v, k])
)

/**
 * 验证 Apple 收据
 * @param {string} receiptData - base64 收据数据
 * @returns {Promise<Object>} Apple 返回的完整响应（含 latest_receipt_info）
 */
export async function verifyReceipt(receiptData) {
  if (!receiptData) throw new Error('收据数据为空')
  if (!process.env.APPLE_IAP_SHARED_SECRET) {
    throw new Error('APPLE_IAP_SHARED_SECRET 未配置')
  }

  const body = {
    'receipt-data': receiptData,
    'password': process.env.APPLE_IAP_SHARED_SECRET,
    'exclude-old-transactions': true
  }

  // 先打生产
  let { data } = await axios.post(PROD_URL, body, { timeout: 15000 })

  // 21007: 沙箱收据被发到生产 → 改用沙箱
  if (data.status === 21007) {
    logger.info('Apple IAP: 沙箱收据，切换到沙箱验证')
    const result = await axios.post(SANDBOX_URL, body, { timeout: 15000 })
    data = result.data
  }

  if (data.status !== 0) {
    logger.error('Apple IAP 验证失败:', data.status, statusReason(data.status))
    throw Object.assign(
      new Error(`收据验证失败：${statusReason(data.status)}`),
      { statusCode: 400, code: 5001 }
    )
  }

  return data
}

/**
 * 从 verifyReceipt 结果中找最新匹配产品的交易
 */
export function findLatestTransaction(verifyResult, productId) {
  const all = verifyResult.latest_receipt_info || verifyResult.receipt?.in_app || []
  const matched = all
    .filter((r) => r.product_id === productId)
    .sort((a, b) => Number(b.purchase_date_ms) - Number(a.purchase_date_ms))

  if (matched.length === 0) return null

  const r = matched[0]
  return {
    transactionId: r.transaction_id,
    originalTransactionId: r.original_transaction_id,
    productId: r.product_id,
    purchaseDateMs: Number(r.purchase_date_ms),
    expiresDateMs: r.expires_date_ms ? Number(r.expires_date_ms) : null,
    isTrialPeriod: r.is_trial_period === 'true',
    cancellationDate: r.cancellation_date_ms ? Number(r.cancellation_date_ms) : null
  }
}

/** Apple 状态码 → 人类可读 */
function statusReason(status) {
  const map = {
    0: '验证成功',
    21000: 'App Store 无法读取',
    21002: '收据数据格式错误',
    21003: '收据无法验证',
    21004: 'shared secret 不匹配',
    21005: '收据服务暂不可用',
    21006: '收据有效但订阅已过期',
    21007: '沙箱收据被发到生产',
    21008: '生产收据被发到沙箱',
    21010: '账号无效或不存在'
  }
  return map[status] || `未知状态码 ${status}`
}
