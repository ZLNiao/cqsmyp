/**
 * 微信支付 V3 - 轻量自研 SDK
 * 文档：https://pay.weixin.qq.com/docs/merchant/apis/in-app-payment/direct-jsapi/jsapi-transfer-payment.html
 *
 * 用到的接口：
 * - POST /v3/pay/transactions/app   App 下单（返回 prepay_id）
 * - 二次签名给前端 uni.requestPayment 调起支付
 * - 异步回调：验签 + AES-GCM 解密
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import axios from 'axios'

const BASE = 'https://api.mch.weixin.qq.com'

class WechatPay {
  constructor(opts) {
    this.appId = opts.appId
    this.mchId = opts.mchId
    this.serialNo = opts.serialNo
    this.privateKey = opts.privateKey
    this.apiV3Key = opts.apiV3Key
    this.notifyUrl = opts.notifyUrl
    this.platformPublicKey = opts.platformPublicKey // 可选：用于回调验签
  }

  /** 构造 Authorization 头（请求签名） */
  _buildAuth(method, urlPath, body = '') {
    const timestamp = Math.floor(Date.now() / 1000)
    const nonce = crypto.randomBytes(16).toString('hex')
    const message = `${method}\n${urlPath}\n${timestamp}\n${nonce}\n${body}\n`
    const signature = crypto
      .createSign('RSA-SHA256')
      .update(message)
      .sign(this.privateKey, 'base64')
    return (
      `WECHATPAY2-SHA256-RSA2048 ` +
      `mchid="${this.mchId}",` +
      `nonce_str="${nonce}",` +
      `signature="${signature}",` +
      `timestamp="${timestamp}",` +
      `serial_no="${this.serialNo}"`
    )
  }

  /** App 下单 */
  async createAppOrder({ outTradeNo, description, amount }) {
    const urlPath = '/v3/pay/transactions/app'
    const body = {
      appid: this.appId,
      mchid: this.mchId,
      description,
      out_trade_no: outTradeNo,
      notify_url: this.notifyUrl,
      amount: { total: amount, currency: 'CNY' }
    }
    const bodyStr = JSON.stringify(body)
    const auth = this._buildAuth('POST', urlPath, bodyStr)
    const { data } = await axios.post(`${BASE}${urlPath}`, body, {
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      timeout: 15000
    })
    return data // { prepay_id }
  }

  /** 给前端 uni.requestPayment 用的二次签名（App 支付） */
  signAppPayParams(prepayId) {
    const timestamp = String(Math.floor(Date.now() / 1000))
    const nonceStr = crypto.randomBytes(16).toString('hex')
    const message = `${this.appId}\n${timestamp}\n${nonceStr}\n${prepayId}\n`
    const sign = crypto
      .createSign('RSA-SHA256')
      .update(message)
      .sign(this.privateKey, 'base64')

    return {
      appid: this.appId,
      partnerid: this.mchId,
      prepayid: prepayId,
      package: 'Sign=WXPay',
      noncestr: nonceStr,
      timestamp,
      sign
    }
  }

  /** 验证回调签名（如有平台公钥则启用） */
  verifyNotify({ timestamp, nonce, body, signature }) {
    if (!this.platformPublicKey) return true // 未配置平台证书时跳过（仅测试）
    const message = `${timestamp}\n${nonce}\n${body}\n`
    return crypto
      .createVerify('RSA-SHA256')
      .update(message)
      .verify(this.platformPublicKey, signature, 'base64')
  }

  /** 解密回调通知（AES-256-GCM） */
  decryptResource({ ciphertext, nonce, associatedData }) {
    const data = Buffer.from(ciphertext, 'base64')
    const authTag = data.slice(-16)
    const encrypted = data.slice(0, -16)
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(this.apiV3Key),
      Buffer.from(nonce)
    )
    decipher.setAuthTag(authTag)
    decipher.setAAD(Buffer.from(associatedData || ''))
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ])
    return JSON.parse(decrypted.toString('utf8'))
  }
}

let instance = null

export function getWechatPay() {
  if (instance) return instance
  if (!process.env.WECHAT_MCH_ID) return null

  // 私钥支持两种方式：文件路径 OR 直接放 .env（注意换行用 \n 转义）
  let privateKey
  if (process.env.WECHAT_PRIVATE_KEY_PATH) {
    privateKey = fs.readFileSync(process.env.WECHAT_PRIVATE_KEY_PATH, 'utf8')
  } else if (process.env.WECHAT_PRIVATE_KEY) {
    privateKey = process.env.WECHAT_PRIVATE_KEY.replace(/\\n/g, '\n')
  } else {
    return null
  }

  let platformPublicKey
  if (process.env.WECHAT_PLATFORM_PUBKEY_PATH) {
    platformPublicKey = fs.readFileSync(
      process.env.WECHAT_PLATFORM_PUBKEY_PATH,
      'utf8'
    )
  }

  instance = new WechatPay({
    appId: process.env.WECHAT_APPID,
    mchId: process.env.WECHAT_MCH_ID,
    serialNo: process.env.WECHAT_SERIAL_NO,
    privateKey,
    apiV3Key: process.env.WECHAT_API_V3_KEY,
    notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL,
    platformPublicKey
  })
  return instance
}
