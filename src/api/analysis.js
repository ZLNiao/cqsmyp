/**
 * 分析相关接口
 * 真实后端会代理调用：百度AI 人脸检测/皮肤分析/人脸对比 + LLM 妆容生成
 */
import { request, upload } from './request'

/**
 * 上传自拍 → 后端调用百度 AI → 返回完整分析结果
 * @param {string} filePath - 本地图片路径
 * @returns {Promise<{faceShape, skinTone, features, celebs, makeup}>}
 */
export async function analyzeFace(filePath) {
  // 真实环境：先上传图片，再请求分析接口
  // const { url } = await upload(filePath)
  // return request({ url: '/analysis/face', method: 'POST', data: { imageUrl: url } })

  // ⚠️ 开发期 mock：3 秒后返回假数据
  await new Promise((r) => setTimeout(r, 1500))
  return {
    faceShape: { label: '心形脸', feature: '额头宽、下巴尖', suit: '柔和眉形、浅色唇妆' },
    skinTone: { label: '暖调 - 春季型', tone: '暖白皮', colors: '大地色、珊瑚色、暖橘色' },
    features: [
      { emoji: '👁️', name: '眼型', value: '杏眼' },
      { emoji: '✏️', name: '眉形', value: '标准眉' },
      { emoji: '💋', name: '唇形', value: 'M 形唇' },
      { emoji: '👃', name: '鼻型', value: '直鼻' }
    ],
    celebs: [
      { emoji: '👩', name: '明星A', sim: 85 },
      { emoji: '👩‍🦰', name: '明星B', sim: 72 },
      { emoji: '👩‍🦱', name: '明星C', sim: 65 }
    ],
    makeup: {
      title: '日常通勤妆',
      steps: [
        '底妆：轻薄粉底 + 局部遮瑕',
        '眼妆：大地色眼影 + 自然眼线',
        '唇妆：豆沙色唇釉',
        '腮红：珊瑚色斜向扫'
      ]
    }
  }
}

/**
 * AI 换妆（V2 功能）
 */
export function generateAiMakeup(filePath, style) {
  return request({
    url: '/analysis/ai-makeup',
    method: 'POST',
    data: { imageUrl: filePath, style }
  })
}

/**
 * 获取历史分析记录
 */
export function getHistory(page = 1) {
  return request({ url: `/analysis/history?page=${page}` })
}
