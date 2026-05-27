/**
 * 用户/登录/支付相关接口
 */
import { request } from './request'

/** 短信登录 */
export function sendSms(phone) {
  return request({ url: '/user/sms', method: 'POST', data: { phone } })
}

export function loginByPhone(phone, code) {
  return request({ url: '/user/login', method: 'POST', data: { phone, code } })
}

/** 获取当前用户信息 */
export function getProfile() {
  return request({ url: '/user/profile' })
}

/** 创建订阅订单 */
export async function createOrder(data) {
  // 真实环境：调用后端创建订单 → 返回微信/支付宝支付参数 → 调起支付
  // const payArgs = await request({ url: '/order/create', method: 'POST', data })
  // return new Promise((resolve, reject) => {
  //   uni.requestPayment({ provider: 'wxpay', ...payArgs, success: resolve, fail: reject })
  // })

  // ⚠️ 开发期 mock
  await new Promise((r) => setTimeout(r, 1000))
  return { orderId: 'mock_' + Date.now(), ...data }
}
