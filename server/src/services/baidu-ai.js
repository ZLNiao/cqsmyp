/**
 * 百度 AI 人脸识别封装
 * 文档：
 *   - 人脸检测 V3：https://ai.baidu.com/ai-doc/FACE/yk37c1u4t
 *   - 人脸搜索 V3：https://ai.baidu.com/ai-doc/FACE/4k37c1ubp
 *   - 人脸库管理：https://ai.baidu.com/ai-doc/FACE/Mk37c1uzc
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
    { timeout: 15000, headers: { 'Content-Type': 'application/json' } }
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

/** 人脸对比 V3 */
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

// ============== 人脸库管理（用于明星相似度）==============

const FACESET_GROUP = process.env.BAIDU_FACESET_GROUP || 'celebrities'

/**
 * 创建人脸库分组（首次运行需要）
 */
export async function createFaceGroup(groupId = FACESET_GROUP) {
  const token = await getAccessToken()
  const { data } = await axios.post(
    `${BASE}/rest/2.0/face/v3/faceset/group/add?access_token=${token}`,
    { group_id: groupId },
    { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
  )
  // 223105 = 已存在，忽略
  if (data.error_code && data.error_code !== 223105) {
    throw new Error(`创建分组失败：${data.error_msg}`)
  }
  logger.info(`人脸库分组 ${groupId} 已就绪`)
}

/**
 * 把一张明星照片加入人脸库
 * @param {Buffer} imageBuffer
 * @param {string} userId - 在百度 FaceSet 中的 ID（自定义，建议拼音）
 * @param {Object} userInfo - 业务元信息（百度限制 256 字符）
 */
export async function addFaceToGroup(imageBuffer, userId, userInfo = {}) {
  const token = await getAccessToken()
  const { data } = await axios.post(
    `${BASE}/rest/2.0/face/v3/faceset/user/add?access_token=${token}`,
    {
      image: imageBuffer.toString('base64'),
      image_type: 'BASE64',
      group_id: FACESET_GROUP,
      user_id: userId,
      user_info: JSON.stringify(userInfo).slice(0, 256),
      quality_control: 'NORMAL',
      liveness_control: 'NONE'
    },
    { timeout: 15000, headers: { 'Content-Type': 'application/json' } }
  )

  // 223103 = 用户已存在（可能添加了多张图）
  if (data.error_code && data.error_code !== 223103) {
    throw new Error(`添加人脸失败：${data.error_msg} (code=${data.error_code})`)
  }
  return data.result
}

/**
 * 删除人脸库中的某个用户
 */
export async function removeFaceFromGroup(userId) {
  const token = await getAccessToken()
  const { data } = await axios.post(
    `${BASE}/rest/2.0/face/v3/faceset/user/delete?access_token=${token}`,
    { group_id: FACESET_GROUP, user_id: userId },
    { timeout: 10000, headers: { 'Content-Type': 'application/json' } }
  )
  if (data.error_code) {
    throw new Error(`删除人脸失败：${data.error_msg}`)
  }
}

/**
 * 在人脸库中搜索相似明星 - top N
 * @param {Buffer} imageBuffer
 * @param {number} userTopNum - 返回最相似的 N 个 user
 * @returns {Promise<Array<{user_id, score, user_info}>>}
 */
export async function searchInGroup(imageBuffer, userTopNum = 3) {
  const token = await getAccessToken()
  const { data } = await axios.post(
    `${BASE}/rest/2.0/face/v3/search?access_token=${token}`,
    {
      image: imageBuffer.toString('base64'),
      image_type: 'BASE64',
      group_id_list: FACESET_GROUP,
      quality_control: 'LOW',
      liveness_control: 'NONE',
      user_top_num: userTopNum
    },
    { timeout: 15000, headers: { 'Content-Type': 'application/json' } }
  )

  // 222207 = 未找到匹配的用户（库为空）
  if (data.error_code === 222207) return []
  if (data.error_code) {
    throw new Error(`人脸搜索失败：${data.error_msg}`)
  }

  return data.result?.user_list || []
}
