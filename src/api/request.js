/**
 * 统一请求封装
 * 所有 API 都走这里：自动加 token、统一错误处理、401 自动跳登录
 */

const BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.your-domain.com/api'
  : 'http://localhost:3000/api'

let isRedirectingToLogin = false

function redirectToLogin() {
  if (isRedirectingToLogin) return
  isRedirectingToLogin = true
  uni.removeStorageSync('token')

  const pages = getCurrentPages()
  const currentPath = pages[pages.length - 1]?.route
  // 已经在登录页就不跳了
  if (currentPath === 'pages/login/login') {
    isRedirectingToLogin = false
    return
  }

  setTimeout(() => {
    uni.navigateTo({
      url: '/pages/login/login',
      complete: () => { isRedirectingToLogin = false }
    })
  }, 600)
}

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
          uni.showToast({ title: '请先登录', icon: 'none' })
          redirectToLogin()
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

/** 上传文件 */
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
        } catch (e) { reject(e) }
      },
      fail: reject
    })
  })
}
