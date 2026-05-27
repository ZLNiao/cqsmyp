<template>
  <view class="profile">
    <view class="header">
      <view class="avatar">{{ user.nickname ? user.nickname[0] : '👤' }}</view>
      <view class="info">
        <view class="nickname">{{ user.nickname || '未登录' }}</view>
        <view class="phone">{{ user.phone || '点击登录' }}</view>
      </view>
    </view>

    <view class="vip-card" :class="{ active: user.isVip }">
      <text class="vip-emoji">⭐</text>
      <view>
        <view class="vip-title">{{ user.isVip ? 'GlamUp 会员' : '开通会员' }}</view>
        <view class="vip-sub">{{ user.isVip ? `到期：${user.vipExpiry}` : '解锁完整分析报告' }}</view>
      </view>
      <view class="vip-btn" @click="goSubscribe">{{ user.isVip ? '续费' : '开通' }}</view>
    </view>

    <view class="menu">
      <view class="item" v-for="(m, i) in menu" :key="i" @click="onMenu(m)">
        <text class="emoji">{{ m.emoji }}</text>
        <text class="label">{{ m.label }}</text>
        <text class="arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { useUserStore } from '@/store/user'

const user = useUserStore()

const menu = [
  { emoji: '📋', label: '分析记录', key: 'history' },
  { emoji: '❤️', label: '我的收藏', key: 'fav' },
  { emoji: '📤', label: '分享给好友', key: 'share' },
  { emoji: '⚙️', label: '设置', key: 'settings' }
]

const goSubscribe = () => uni.navigateTo({ url: '/pages/subscribe/subscribe' })
const onMenu = (m) => uni.showToast({ title: m.label, icon: 'none' })
</script>

<style lang="scss" scoped>
.profile { padding: 32rpx; }
.header {
  display: flex; align-items: center; gap: 24rpx;
  background: #fff; padding: 32rpx; border-radius: 24rpx; margin-bottom: 24rpx;
}
.avatar {
  width: 120rpx; height: 120rpx; border-radius: 50%;
  background: linear-gradient(135deg, #8B5CF6, #6D28D9);
  color: #fff; line-height: 120rpx; text-align: center; font-size: 56rpx;
}
.nickname { font-size: 36rpx; font-weight: 600; color: #1F2937; }
.phone { font-size: 26rpx; color: #6B7280; margin-top: 8rpx; }
.vip-card {
  display: flex; align-items: center; gap: 20rpx;
  background: linear-gradient(135deg, #FEF3C7, #FDE68A);
  padding: 28rpx; border-radius: 24rpx; margin-bottom: 24rpx;
  &.active { background: linear-gradient(135deg, #FBBF24, #F59E0B); color: #fff; }
}
.vip-emoji { font-size: 48rpx; }
.vip-title { font-size: 30rpx; font-weight: 700; color: #92400E; }
.vip-sub { font-size: 24rpx; color: #92400E; margin-top: 4rpx; opacity: .8; }
.vip-btn {
  margin-left: auto; padding: 12rpx 28rpx; background: #92400E;
  color: #fff; border-radius: 32rpx; font-size: 26rpx;
}
.menu { background: #fff; border-radius: 24rpx; overflow: hidden; }
.item {
  display: flex; align-items: center; gap: 20rpx;
  padding: 32rpx; border-bottom: 1rpx solid #F3F4F6;
  &:last-child { border-bottom: none; }
}
.emoji { font-size: 36rpx; }
.label { flex: 1; font-size: 30rpx; color: #1F2937; }
.arrow { color: #9CA3AF; font-size: 36rpx; }
</style>
