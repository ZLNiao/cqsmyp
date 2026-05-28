/**
 * 阿里云短信发送
 * 使用 POP API 直接调用，不引入 SDK
 * 文档：https://help.aliyun.com/document_detail/419274.html
 */
import crypto from 'node:crypto'
import axios from 'axios'
import logger from '../utils/logger.js'

const ENDPOINT = 'https://dysmsapi.aliyuncs.com'

function encodeRFC3986(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
}

/** 阿里云 POP 签名（HMAC-SHA1） */
function buildSignature(params, accessKeySecret) {
  const sortedKeys = Object.keys(params).sort()
  const canonicalQuery = sortedKeys
    .map((k) => `${encodeRFC3986(k)}=${encodeRFC3986(params[k])}`)
    .join('&')
  const stringToSign = `POST&%2F&${encodeRFC3986(canonicalQuery)}`
  return crypto
    .createHmac('sha1', accessKeySecret + '&')
    .update(stringToSign)
    .digest('base64')
}

/**
 * 发送验证码短信
 * @param {string} phone - 11 位手机号
 * @param {string} code - 6 位验证码
 */
export async function sendSms(phone, code) {
  // 未配置 AK 时降级为 mock，便于开发
  if (!process.env.SMS_ACCESS_KEY) {
    logger.warn(`[SMS Mock] phone=${phone} code=${code}`)
    return { mocked: true }
  }

  const params = {
    AccessKeyId: process.env.SMS_ACCESS_KEY,
    Action: 'SendSms',
    Format: 'JSON',
    PhoneNumbers: phone,
    SignName: process.env.SMS_SIGN_NAME,
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: crypto.randomUUID(),
    SignatureVersion: '1.0',
    TemplateCode: process.env.SMS_TEMPLATE_CODE,
    TemplateParam: JSON.stringify({ code }),
    Timestamp: new Date().toISOString(),
    Version: '2017-05-25'
  }
  params.Signature = buildSignature(params, process.env.SMS_SECRET)

  const { data } = await axios.post(ENDPOINT, null, { params, timeout: 10000 })
  if (data.Code !== 'OK') {
    logger.error('短信发送失败', data)
    throw new Error(`短信发送失败：${data.Message || data.Code}`)
  }
  return data
}
