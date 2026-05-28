import request from './request'

export const login = (data) => request.post('/admin/login', data)
export const getProfile = () => request.get('/admin/profile')
export const getDashboard = () => request.get('/admin/dashboard')

export const getUsers = (params) => request.get('/admin/users', { params })
export const setUserVip = (id, days) => request.put(`/admin/users/${id}/vip`, { days })

export const getOrders = (params) => request.get('/admin/orders', { params })
export const getAnalyses = (params) => request.get('/admin/analyses', { params })

export const getCelebrities = () => request.get('/admin/celebrities')
export const addCelebrity = (formData) =>
  request.post('/admin/celebrities', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
export const removeCelebrity = (baiduUserId) =>
  request.delete(`/admin/celebrities/${baiduUserId}`)

// =============== 高级分析 ===============

/** 转化漏斗 */
export const getFunnel = (days = 30) => request.get('/admin/funnel', { params: { days } })

/** 留存矩阵 */
export const getRetention = (weeks = 8) => request.get('/admin/retention', { params: { weeks } })

/** 收入指标（ARPU/ARPPU/LTV） */
export const getRevenueMetrics = () => request.get('/admin/revenue-metrics')

/** 用户分布 */
export const getDistribution = (days = 30) => request.get('/admin/distribution', { params: { days } })
