/**
 * 分析相关接口（真实接入百度 AI）
 * 后端串起：百度人脸检测 V3 + 五官几何运算 + sharp 肤色分析 + 12 季型 + LLM 妆容
 */
import { request } from './request'

const BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.your-domain.com/api'
  : 'http://localhost:3000/api'

/**
 * 上传自拍 → 完整分析
 * @param {string} filePath - uni.chooseImage 返回的本地路径
 * @param {Object} userInfo - { age, gender, makeupFreq, skinNeeds }
 * @returns {Promise<{faceShape, skinTone, features, celebs, makeup, beauty, age}>}
 */
export function analyzeFace(filePath, userInfo = {}) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.showToast({ title: '请先登录', icon: 'none' })
      uni.navigateTo({ url: '/pages/login/login' })
      return reject(new Error('未登录'))
    }

    uni.uploadFile({
      url: BASE_URL + '/analysis/face',
      filePath,
      name: 'file',
      formData: {
        userInfo: JSON.stringify(userInfo)
      },
      header: { Authorization: `Bearer ${token}` },
      timeout: 60000, // AI 分析较慢，给足超时时间
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.code === 0) {
            resolve(data.data)
          } else if (res.statusCode === 401) {
            uni.removeStorageSync('token')
            uni.showToast({ title: '请重新登录', icon: 'none' })
            uni.navigateTo({ url: '/pages/login/login' })
            reject(data)
          } else {
            uni.showToast({ title: data.message || '分析失败', icon: 'none', duration: 3000 })
            reject(data)
          }
        } catch (e) {
          uni.showToast({ title: '解析响应失败', icon: 'none' })
          reject(e)
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络错误，请重试', icon: 'none' })
        reject(err)
      }
    })
  })
}

/**
 * 历史分析记录列表
 */
export function getHistory(page = 1) {
  return request({ url: `/analysis/history?page=${page}` })
}

/**
 * 历史记录详情
 */
export function getAnalysisDetail(id) {
  return request({ url: `/analysis/${id}` })
}

/**
 * 获取 AI 换妆可选风格
 */
export function getMakeupStyles() {
  return request({ url: '/analysis/ai-makeup/styles' })
}

/**
 * AI 换妆生成
 * @param {string} filePath - 本地图路径
 * @param {string} style - daily/date/retro/cool
 */
export function generateAiMakeup(filePath, style) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.showToast({ title: '请先登录', icon: 'none' })
      return reject(new Error('未登录'))
    }

    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://api.your-domain.com/api'
      : 'http://localhost:3000/api'

    uni.uploadFile({
      url: baseUrl + '/analysis/ai-makeup',
      filePath,
      name: 'file',
      formData: { style },
      header: { Authorization: `Bearer ${token}` },
      timeout: 90000, // AI 生成更慢，给 90 秒
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.code === 0) {
            resolve(data.data)
          } else if (data.code === 4030) {
            uni.showToast({ title: data.message, icon: 'none' })
            reject(data)
          } else {
            uni.showToast({ title: data.message || '生成失败', icon: 'none' })
            reject(data)
          }
        } catch (e) { reject(e) }
      },
      fail: (err) => {
        uni.showToast({ title: '网络错误', icon: 'none' })
        reject(err)
      }
    })
  })
}

/**
 * AI 换妆历史
 */
export function getMakeupHistory() {
  return request({ url: '/analysis/ai-makeup/history' })
}
