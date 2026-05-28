<template>
  <view class="profile">
    <!-- 渐变 hero -->
    <view class="hero">
      <view class="bg-decoration" />
      <view class="user-row">
        <view class="avatar">
          <text v-if="!user.nickname">👤</text>
          <text v-else>{{ user.nickname[0] }}</text>
          <view v-if="user.isVip" class="vip-badge">VIP</view>
        </view>
        <view class="user-info">
          <view class="nickname">{{ user.nickname || '点击登录' }}</view>
          <view class="phone">{{ user.phone || '解锁更多功能' }}</view>
        </view>
        <view class="edit" @click="onLogin">{{ user.token ? '编辑' : '登录' }}</view>
      </view>

      <!-- 统计卡 -->
      <view class="stats">
        <view v-for="(s, i) in stats" :key="i" class="stat">
          <view class="stat-num">{{ s.value }}</view>
          <view class="stat-label">{{ s.label }}</view>
        </view>
      </view>
    </view>

    <!-- VIP 卡片 -->
    <view class="vip-card" :class="{ active: user.isVip }" @click="goSubscribe">
      <view class="vip-bg" />
      <view class="vip-content">
        <view class="vip-emoji">{{ user.isVip ? '👑' : '⭐' }}</view>
        <view class="vip-text">
          <view class="vip-title">{{ user.isVip ? 'GlamUp 至尊会员' : '开通会员，解锁全部功能' }}</view>
          <view class="vip-sub">{{ user.isVip ? `到期：${user.vipExpiry}` : '7 天免费试用 · 限时特惠' }}</view>
        </view>
        <view class="vip-btn">{{ user.isVip ? '续费' : '立即开通' }}</view>
      </view>
    </view>

    <!-- 最近记录 -->
    <view class="section">
      <view class="section-head">
        <text class="section-title">最近分析</text>
        <text class="more">查看全部 ›</text>
      </view>
      <view v-if="history.length === 0" class="empty">
        <text class="empty-emoji">📋</text>
        <text class="empty-text">还没有分析记录</text>
        <view class="empty-btn" @click="goHome">去首页拍一张</view>
      </view>
      <view v-else class="history-list">
        <view v-for="(h, i) in history" :key="i" class="history-item">
          <view class="history-thumb" :style="{ background: h.color }">{{ h.emoji }}</view>
          <view class="history-info">
            <view class="history-title">{{ h.title }}</view>
            <view class="history-time">{{ h.time }}</view>
          </view>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 菜单 -->
    <view class="menu">
      <view class="item" v-for="(m, i) in menu" :key="i" @click="onMenu(m)">
        <view class="item-icon" :style="{ background: m.bg }">{{ m.emoji }}</view>
        <text class="item-label">{{ m.label }}</text>
        <text v-if="m.badge" class="item-badge">{{ m.badge }}</text>
        <text class="arrow">›</text>
      </view>
    </view>

    <view class="footer">
      <text>GlamUp v1.0.0</text>
      <text class="dot">·</text>
      <text>用 AI 让每个人都更美 ✨</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'

const user = useUserStore()

onShow(() => {
  // 每次进入页面拉一次最新用户信息（VIP 状态、续费等）
  user.fetchProfile()
})

const stats = [
  { label: '分析次数', value: 12 },
  { label: '收藏妆容', value: 5 },
  { label: '会员天数', value: user.isVip ? 89 : 0 }
]

const history = ref([
  { emoji: '💗', color: 'linear-gradient(135deg, #FBCFE8, #F472B6)', title: '心形脸 · 暖调春季型', time: '昨天 18:32' },
  { emoji: '🥚', color: 'linear-gradient(135deg, #DDD6FE, #8B5CF6)', title: '鹅蛋脸 · 冷调夏季型', time: '3 天前' }
])

const menu = [
  { emoji: '📋', label: '分析记录', bg: 'linear-gradient(135deg, #DDD6FE, #8B5CF6)', key: 'history' },
  { emoji: '❤️', label: '我的收藏', bg: 'linear-gradient(135deg, #FBCFE8, #F472B6)', key: 'fav' },
  { emoji: '💎', label: '订单中心', bg: 'linear-gradient(135deg, #BFDBFE, #3B82F6)', key: 'orders' },
  { emoji: '📤', label: '分享 GlamUp', bg: 'linear-gradient(135deg, #FDE68A, #F59E0B)', key: 'share', badge: '送 7 天 VIP' },
  { emoji: '💌', label: '意见反馈', bg: 'linear-gradient(135deg, #BBF7D0, #10B981)', key: 'feedback' },
  { emoji: '📜', label: '用户协议', bg: 'linear-gradient(135deg, #DDD6FE, #A78BFA)', key: 'agreement-user' },
  { emoji: '🔒', label: '隐私政策', bg: 'linear-gradient(135deg, #BFDBFE, #60A5FA)', key: 'agreement-privacy' },
  { emoji: '⚙️', label: '设置', bg: 'linear-gradient(135deg, #E5E7EB, #9CA3AF)', key: 'settings' }
]

const onLogin = () => {
  if (user.isLogin) {
    uni.showActionSheet({
      itemList: ['退出登录'],
      success: (res) => {
        if (res.tapIndex === 0) {
          user.logout()
          uni.showToast({ title: '已退出', icon: 'success' })
        }
      }
    })
  } else {
    uni.navigateTo({ url: '/pages/login/login' })
  }
}
const goSubscribe = () => uni.navigateTo({ url: '/pages/subscribe/subscribe' })
const goHome = () => uni.switchTab({ url: '/pages/index/index' })
const onMenu = (m) => {
  if (m.key === 'agreement-user') {
    uni.navigateTo({ url: '/pages/agreement/agreement?type=user' })
  } else if (m.key === 'agreement-privacy') {
    uni.navigateTo({ url: '/pages/agreement/agreement?type=privacy' })
  } else {
    uni.showToast({ title: m.label, icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
.profile { min-height: 100vh; padding-bottom: 60rpx; }

/* Hero */
.hero {
  position: relative;
  background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 50%, #EC4899 100%);
  padding: 80rpx 32rpx 32rpx;
  border-radius: 0 0 40rpx 40rpx;
  overflow: hidden;
}
.bg-decoration {
  position: absolute; top: -200rpx; right: -200rpx;
  width: 500rpx; height: 500rpx; border-radius: 50%;
  background: rgba(255,255,255,.1);
}
.user-row {
  display: flex; align-items: center; gap: 24rpx; margin-bottom: 32rpx;
  position: relative; z-index: 2;
}
.avatar {
  position: relative;
  width: 120rpx; height: 120rpx; border-radius: 50%;
  background: rgba(255,255,255,.25);
  backdrop-filter: blur(10rpx);
  display: flex; align-items: center; justify-content: center;
  font-size: 56rpx; color: #fff;
  border: 4rpx solid rgba(255,255,255,.4);
}
.vip-badge {
  position: absolute; bottom: -4rpx; right: -8rpx;
  padding: 2rpx 12rpx; background: linear-gradient(135deg, #FBBF24, #F59E0B);
  color: #fff; font-size: 18rpx; font-weight: 700; border-radius: 12rpx;
  border: 2rpx solid #fff;
}
.user-info { flex: 1; color: #fff; }
.nickname { font-size: 36rpx; font-weight: 700; }
.phone { font-size: 24rpx; opacity: .85; margin-top: 6rpx; }
.edit {
  padding: 12rpx 28rpx; background: rgba(255,255,255,.25);
  color: #fff; border-radius: 32rpx; font-size: 24rpx;
  backdrop-filter: blur(10rpx);
}

/* 统计 */
.stats {
  display: flex; padding: 24rpx 0;
  background: rgba(255,255,255,.15);
  backdrop-filter: blur(20rpx);
  border-radius: 24rpx;
  position: relative; z-index: 2;
}
.stat {
  flex: 1; text-align: center; color: #fff;
  &:not(:last-child) {
    border-right: 2rpx solid rgba(255,255,255,.2);
  }
}
.stat-num { font-size: 40rpx; font-weight: 800; }
.stat-label { font-size: 22rpx; opacity: .85; margin-top: 4rpx; }

/* VIP 卡 */
.vip-card {
  position: relative; margin: 24rpx 32rpx;
  border-radius: 24rpx; overflow: hidden;
  box-shadow: 0 12rpx 32rpx rgba(251, 191, 36, .25);
}
.vip-bg {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, #FEF3C7, #FBBF24, #F59E0B);
}
.vip-card.active .vip-bg {
  background: linear-gradient(135deg, #FCD34D, #F59E0B, #DC2626);
}
.vip-content {
  position: relative; z-index: 2;
  display: flex; align-items: center; gap: 16rpx; padding: 28rpx;
}
.vip-emoji { font-size: 56rpx; }
.vip-text { flex: 1; color: #92400E; }
.vip-card.active .vip-text { color: #fff; }
.vip-title { font-size: 30rpx; font-weight: 700; }
.vip-sub { font-size: 22rpx; opacity: .85; margin-top: 4rpx; }
.vip-btn {
  padding: 12rpx 28rpx; background: #92400E; color: #fff;
  border-radius: 32rpx; font-size: 24rpx; font-weight: 600;
}
.vip-card.active .vip-btn { background: #fff; color: #DC2626; }

/* 区块 */
.section { margin: 24rpx 32rpx 0; }
.section-head {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx;
}
.section-title { font-size: 30rpx; font-weight: 700; color: #1F2937; }
.more { font-size: 24rpx; color: #8B5CF6; }

.empty {
  background: #fff; border-radius: 20rpx; padding: 60rpx 32rpx;
  text-align: center;
}
.empty-emoji { font-size: 80rpx; }
.empty-text { display: block; font-size: 26rpx; color: #6B7280; margin: 16rpx 0 24rpx; }
.empty-btn {
  display: inline-block; padding: 16rpx 40rpx;
  background: linear-gradient(135deg, #8B5CF6, #6D28D9);
  color: #fff; border-radius: 32rpx; font-size: 26rpx; font-weight: 600;
}

.history-list {
  background: #fff; border-radius: 20rpx; overflow: hidden;
}
.history-item {
  display: flex; align-items: center; gap: 20rpx;
  padding: 24rpx 28rpx;
  border-bottom: 1rpx solid #F3F4F6;
  &:last-child { border-bottom: none; }
}
.history-thumb {
  width: 80rpx; height: 80rpx; border-radius: 20rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 40rpx; flex-shrink: 0;
}
.history-info { flex: 1; }
.history-title { font-size: 28rpx; font-weight: 600; color: #1F2937; }
.history-time { font-size: 22rpx; color: #9CA3AF; margin-top: 4rpx; }

/* 菜单 */
.menu {
  margin: 24rpx 32rpx; background: #fff; border-radius: 20rpx; overflow: hidden;
}
.item {
  display: flex; align-items: center; gap: 16rpx;
  padding: 24rpx 28rpx;
  border-bottom: 1rpx solid #F3F4F6;
  &:last-child { border-bottom: none; }
}
.item-icon {
  width: 64rpx; height: 64rpx; border-radius: 16rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 32rpx; flex-shrink: 0;
}
.item-label { flex: 1; font-size: 28rpx; color: #1F2937; }
.item-badge {
  padding: 4rpx 12rpx; background: linear-gradient(135deg, #FEE2E2, #FCA5A5);
  color: #DC2626; font-size: 20rpx; font-weight: 600; border-radius: 12rpx;
  margin-right: 8rpx;
}
.arrow { color: #9CA3AF; font-size: 36rpx; }

.footer {
  display: flex; align-items: center; justify-content: center; gap: 8rpx;
  font-size: 22rpx; color: #9CA3AF; padding: 32rpx 16rpx;
}
.dot { color: #D1D5DB; }
</style>
