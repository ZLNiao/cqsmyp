import { defineStore } from 'pinia'
import { getProfile } from '@/api/user'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: uni.getStorageSync('token') || '',
    id: 0,
    nickname: '',
    phone: '',
    avatar: '',
    isVip: false,
    vipExpiry: ''
  }),
  getters: {
    isLogin: (s) => !!s.token
  },
  actions: {
    setToken(token) {
      this.token = token
      if (token) uni.setStorageSync('token', token)
      else uni.removeStorageSync('token')
    },
    setProfile(p) {
      if (!p) return
      this.id = p.id || 0
      this.nickname = p.nickname || ''
      this.phone = p.phone || ''
      this.avatar = p.avatar || ''
      this.isVip = !!p.isVip
      this.vipExpiry = p.vipExpiry || ''
    },
    /** 拉最新用户信息（首页 onShow / 支付完成后调用） */
    async fetchProfile() {
      if (!this.token) return null
      try {
        const data = await getProfile()
        this.setProfile(data)
        return data
      } catch {
        return null
      }
    },
    logout() {
      this.setToken('')
      this.id = 0
      this.nickname = ''
      this.phone = ''
      this.avatar = ''
      this.isVip = false
      this.vipExpiry = ''
    }
  }
})
