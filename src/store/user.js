import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: uni.getStorageSync('token') || '',
    nickname: '',
    phone: '',
    isVip: false,
    vipExpiry: ''
  }),
  actions: {
    setToken(token) {
      this.token = token
      uni.setStorageSync('token', token)
    },
    setProfile(profile) {
      this.nickname = profile.nickname
      this.phone = profile.phone
      this.isVip = profile.isVip
      this.vipExpiry = profile.vipExpiry
    },
    logout() {
      this.token = ''
      this.nickname = ''
      this.phone = ''
      this.isVip = false
      uni.removeStorageSync('token')
    }
  }
})
