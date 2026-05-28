/**
 * 统一请求封装
 * 所有 API 都走这里：自动加 token、统一错误处理
 */

// API 域名按环境切换
// 开发：本地后端 http://localhost:3000/api
// 生产：HTTPS 域名（必须 HTTPS，否则 iOS ATS 会拒绝）
const BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.your-domain.com/api'
  : 'http://localhost:3000/api'

export function request(options) {
  const token = uni.getStorageSync('token')

  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.header || {})
      },
      timeout: 30000,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.code === 0) {
          resolve(res.data.data)
        } else if (res.statusCode === 401) {
          uni.removeStorageSync('token')
          uni.showToast({ title: '请重新登录', icon: 'none' })
          reject(res.data)
        } else {
          uni.showToast({ title: res.data?.message || '请求失败', icon: 'none' })
          reject(res.data)
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络错误', icon: 'none' })
        reject(err)
      }
    })
  })
}

/**
 * 上传文件（用于上传自拍）
 */
export function upload(filePath, formData = {}) {
  const token = uni.getStorageSync('token')
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: BASE_URL + '/upload',
      filePath,
      name: 'file',
      formData,
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.code === 0) resolve(data.data)
          else reject(data)
        } catch (e) {
          reject(e)
        }
      },
      fail: reject
    })
  })
}
