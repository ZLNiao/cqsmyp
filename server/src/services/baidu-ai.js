/**
 * 百度 AI 服务封装
 * 文档：https://ai.baidu.com/ai-doc/FACE/yk37c1u4t
 */
import axios from 'axios'

let cachedToken = null
let tokenExpiry = 0

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken
  const { data } = await axios.post('https://aip.baidubce.com/oauth/2.0/token', null, {
    params: {
      grant_type: 'client_credentials',
      client_id: process.env.BAIDU_AI_API_KEY,
      client_secret: process.env.BAIDU_AI_SECRET_KEY
    }
  })
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 300) * 1000
  return cachedToken
}

/** 人脸检测 - 返回脸型、五官 */
export async function detectFace(imageBuffer) {
  const token = await getAccessToken()
  const { data } = await axios.post(
    `https://aip.baidubce.com/rest/2.0/face/v3/detect?access_token=${token}`,
    {
      image: imageBuffer.toString('base64'),
      image_type: 'BASE64',
      face_field: 'age,gender,face_shape,quality,landmark150'
    }
  )

  if (data.error_code) throw new Error(`百度人脸检测失败：${data.error_msg}`)

  const face = data.result?.face_list?.[0]
  return {
    shape: mapFaceShape(face?.face_shape?.type), // square/triangle/oval/heart/round
    features: extractFeatures(face?.landmark150)
  }
}

/** 皮肤分析（需单独申请：百度 AI 智能美颜） */
export async function analyzeSkin(_imageBuffer) {
  // TODO: 实际接入皮肤分析接口
  return {
    tone: { label: '暖调 · 春季型', skin: '暖白皮' }
  }
}

function mapFaceShape(type) {
  const map = {
    square: { label: '方脸', feature: '下颌方正、棱角分明' },
    triangle: { label: '三角脸', feature: '上窄下宽' },
    oval: { label: '鹅蛋脸', feature: '比例匀称、线条流畅' },
    heart: { label: '心形脸', feature: '额头宽、下巴尖' },
    round: { label: '圆脸', feature: '脸颊饱满、轮廓柔和' }
  }
  return map[type] || map.oval
}

function extractFeatures(_landmarks) {
  // TODO: 根据 150 个关键点几何关系推断眼型、眉形、唇形、鼻型
  return [
    { emoji: '👁️', name: '眼型', value: '杏眼' },
    { emoji: '✏️', name: '眉形', value: '标准眉' },
    { emoji: '💋', name: '唇形', value: 'M 形唇' },
    { emoji: '👃', name: '鼻型', value: '直鼻' }
  ]
}
