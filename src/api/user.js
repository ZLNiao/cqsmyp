/**
 * 用户/登录/支付相关接口
 */
import { request } from './request'

/** 发送短信验证码 */
export function sendSms(phone) {
  return request({ url: '/user/sms', method: 'POST', data: { phone } })
}

/** 手机号登录 */
export function loginByPhone(phone, code) {
  return request({ url: '/user/login', method: 'POST', data: { phone, code } })
}

/** 获取当前用户信息 */
export function getProfile() {
  return request({ url: '/user/profile' })
}

/** 登出 */
export function logout() {
  return request({ url: '/user/logout', method: 'POST' })
}

/**
 * 创建订阅订单
 * @param {{ plan: 'month' | 'quarter' | 'year' }} data
 * @returns {Promise<{ orderId, payArgs, mock? }>}
 */
export function createOrder(data) {
  return request({ url: '/order/create', method: 'POST', data })
}

/** 查询订单状态 */
export function getOrderStatus(orderNo) {
  return request({ url: `/order/status/${orderNo}` })
}

/**
 * iOS Apple IAP 收据验证
 * @param {string} receiptData - base64 收据
 * @param {string} productId - Apple 产品 ID
 */
export function verifyAppleReceipt(receiptData, productId) {
  return request({
    url: '/order/iap/verify',
    method: 'POST',
    data: { receiptData, productId }
  })
}
