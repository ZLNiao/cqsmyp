/**
 * 百度 AI 人脸识别封装
 * 文档：
 *   - 人脸检测 V3：https://ai.baidu.com/ai-doc/FACE/yk37c1u4t
 *   - landmark150：https://ai.baidu.com/ai-doc/FACE/yk37c1u4t#landmark150
 */
import axios from 'axios'
import logger from '../utils/logger.js'

const BASE = 'https://aip.baidubce.com'

let cachedToken = null
let tokenExpiry = 0

/** 获取 access_token（缓存 24 小时） */
async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  if (!process.env.BAIDU_AI_API_KEY || !process.env.BAIDU_AI_SECRET_KEY) {
    throw new Error('BAIDU_AI_API_KEY / BAIDU_AI_SECRET_KEY 未配置')
  }

  const { data } = await axios.post(`${BASE}/oauth/2.0/token`, null, {
    params: {
      grant_type: 'client_credentials',
      client_id: process.env.BAIDU_AI_API_KEY,
      client_secret: process.env.BAIDU_AI_SECRET_KEY
    },
    timeout: 10000
  })

  if (data.error) {
    throw new Error(`百度 token 获取失败：${data.error_description || data.error}`)
  }

  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000
  logger.info('百度 AI token 已刷新')
  return cachedToken
}

/**
 * 人脸检测 V3（核心接口）
 * 返回原始 face 对象，包含 face_shape / landmark150 / quality 等
 */
export async function detectFace(imageBuffer) {
  const token = await getAccessToken()
  const { data } = await axios.post(
    `${BASE}/rest/2.0/face/v3/detect?access_token=${token}`,
    {
      image: imageBuffer.toString('base64'),
      image_type: 'BASE64',
      face_field: 'age,gender,beauty,face_shape,quality,landmark150,emotion',
      max_face_num: 1
    },
    {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    }
  )

  if (data.error_code) {
    logger.error('百度人脸检测失败', data)
    if (data.error_code === 222202) {
      throw Object.assign(new Error('未检测到人脸，请上传清晰的正面照'), {
        statusCode: 400, code: 4001
      })
    }
    throw new Error(`百度人脸检测失败：${data.error_msg}`)
  }

  const face = data.result?.face_list?.[0]
  if (!face) {
    throw Object.assign(new Error('未检测到人脸'), { statusCode: 400, code: 4001 })
  }

  // 质量检查
  if (face.quality) {
    const q = face.quality
    if (q.blur > 0.7) {
      throw Object.assign(new Error('照片过于模糊，请重新上传'), { statusCode: 400, code: 4002 })
    }
    if (q.illumination < 40) {
      throw Object.assign(new Error('光线过暗，请在明亮环境下拍摄'), { statusCode: 400, code: 4003 })
    }
  }

  return face
}

/**
 * 人脸对比 V3（明星相似度用）
 * @returns {Promise<number>} 0~100
 */
export async function compareFaces(image1, image2) {
  const token = await getAccessToken()
  const { data } = await axios.post(
    `${BASE}/rest/2.0/face/v3/match?access_token=${token}`,
    [
      { image: image1.toString('base64'), image_type: 'BASE64', face_type: 'LIVE', quality_control: 'LOW' },
      { image: image2.toString('base64'), image_type: 'BASE64', face_type: 'LIVE', quality_control: 'LOW' }
    ],
    { timeout: 15000, headers: { 'Content-Type': 'application/json' } }
  )

  if (data.error_code) throw new Error(`人脸对比失败：${data.error_msg}`)
  return data.result?.score || 0
}
