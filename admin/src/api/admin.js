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
