<template>
  <view class="home">
    <!-- 顶部渐变背景 -->
    <view class="hero" :style="{ paddingTop: (statusBarHeight + 20) + 'px' }">
      <view class="navbar">
        <view class="logo-wrap">
          <text class="logo-emoji">✨</text>
          <text class="logo">GlamUp</text>
        </view>
        <view class="bell">
          <text class="bell-icon">🔔</text>
          <view class="bell-dot" />
        </view>
      </view>

      <!-- 问候 -->
      <view class="greet">
        <view class="greet-title">{{ greetTitle }}, 美人 👋</view>
        <view class="greet-sub">今天也想看看自己有多美吗？</view>
      </view>

      <!-- 每日小贴士卡片 -->
      <view class="tip-card">
        <view class="tip-tag">💡 今日色彩小贴士</view>
        <view class="tip-content">{{ dailyTip }}</view>
      </view>
    </view>

    <!-- 上传卡片 -->
    <upload-card @pick="onPickPhoto" />

    <!-- 三大功能图标 -->
    <view class="features">
      <view class="feature" v-for="(f, i) in features" :key="i">
        <view class="feature-icon" :style="{ background: f.bg }">{{ f.emoji }}</view>
        <view class="feature-label">{{ f.label }}</view>
      </view>
    </view>

    <!-- 案例横滑 -->
    <view class="section-head">
      <view>
        <view class="section-title">看看她们的变化</view>
        <view class="section-sub">已有 12,580 位用户完成分析</view>
      </view>
      <text class="more">更多 ›</text>
    </view>
    <scroll-view class="cases" scroll-x show-scrollbar="false">
      <case-card v-for="(c, i) in cases" :key="i" :data="c" />
    </scroll-view>

    <!-- 历史入口 -->
    <view v-if="lastResult" class="history" @click="goResult">
      <view class="history-icon">📋</view>
      <view class="history-text">
        <view class="history-title">上次分析结果</view>
        <view class="history-time">查看完整报告</view>
      </view>
      <text class="arrow">›</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const statusBarHeight = ref(20)
const lastResult = ref(null)

const greetTitle = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '晚安'
  if (h < 12) return '早上好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const dailyTips = [
  '暖调皮肤搭配珊瑚色和橘红色更显气色',
  '心形脸适合中分长发或锁骨发',
  '杏眼用大地色眼影最有韩系氛围感',
  '冷调皮肤选玫瑰粉/正红色唇膏更显白',
  '方脸建议用柔和的弧形眉减少棱角'
]
const dailyTip = ref(dailyTips[Math.floor(Math.random() * dailyTips.length)])

const features = [
  { emoji: '🔍', label: '脸型分析', bg: 'linear-gradient(135deg, #FDE68A, #F59E0B)' },
  { emoji: '🎨', label: '色彩季型', bg: 'linear-gradient(135deg, #DDD6FE, #8B5CF6)' },
  { emoji: '💄', label: 'AI 妆容', bg: 'linear-gradient(135deg, #FBCFE8, #EC4899)' }
]

const cases = [
  { name: '小雅', tag: '心形脸 · 暖调', color1: '#FDE68A', color2: '#F472B6' },
  { name: 'Lily', tag: '鹅蛋脸 · 冷调', color1: '#A5B4FC', color2: '#8B5CF6' },
  { name: '糖糖', tag: '圆脸 · 中性调', color1: '#FCA5A5', color2: '#F87171' },
  { name: 'Anna', tag: '方脸 · 暖调', color1: '#FBBF24', color2: '#F59E0B' },
  { name: 'Joy', tag: '长脸 · 冷调', color1: '#C4B5FD', color2: '#7C3AED' }
]

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  if (!uni.getStorageSync('onboarded')) {
    uni.reLaunch({ url: '/pages/onboard/onboard' })
  }
})

onShow(() => {
  lastResult.value = uni.getStorageSync('lastAnalysis') || null
})

const onPickPhoto = (sourceType) => {
  uni.chooseImage({
    sourceType: [sourceType],
    count: 1,
    success: (res) => {
      uni.setStorageSync('pendingPhoto', res.tempFilePaths[0])
      uni.navigateTo({ url: '/pages/info/info' })
    }
  })
}

const goResult = () => uni.navigateTo({ url: '/pages/result/result' })
</script>

<style lang="scss" scoped>
.home { min-height: 100vh; padding-bottom: 60rpx; }

/* 顶部 hero */
.hero {
  background: linear-gradient(180deg, #F5F3FF 0%, #FDF2F8 60%, #F8F9FA 100%);
  padding: 0 32rpx 32rpx;
  border-radius: 0 0 40rpx 40rpx;
}
.navbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16rpx 0 24rpx;
}
.logo-wrap { display: flex; align-items: center; gap: 8rpx; }
.logo-emoji { font-size: 36rpx; }
.logo {
  font-size: 40rpx; font-weight: 800; letter-spacing: 1rpx;
  background: linear-gradient(135deg, #8B5CF6, #EC4899);
  -webkit-background-clip: text; color: transparent;
}
.bell { position: relative; }
.bell-icon { font-size: 36rpx; }
.bell-dot {
  position: absolute; top: 0; right: 0;
  width: 12rpx; height: 12rpx; border-radius: 50%; background: #EF4444;
}

.greet { padding: 16rpx 8rpx 28rpx; }
.greet-title { font-size: 44rpx; font-weight: 700; color: #1F2937; }
.greet-sub { font-size: 26rpx; color: #6B7280; margin-top: 8rpx; }

.tip-card {
  background: rgba(255, 255, 255, .8);
  backdrop-filter: blur(20rpx);
  padding: 24rpx 28rpx; border-radius: 20rpx;
  border: 2rpx solid rgba(139, 92, 246, .1);
}
.tip-tag { font-size: 24rpx; color: #8B5CF6; font-weight: 600; }
.tip-content { font-size: 28rpx; color: #1F2937; margin-top: 8rpx; line-height: 1.5; }

/* 三大功能 */
.features {
  display: flex; justify-content: space-around;
  margin: 16rpx 32rpx 32rpx;
  padding: 32rpx 0;
  background: #fff; border-radius: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,.04);
}
.feature { display: flex; flex-direction: column; align-items: center; gap: 12rpx; }
.feature-icon {
  width: 96rpx; height: 96rpx; border-radius: 28rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 48rpx;
  box-shadow: 0 8rpx 20rpx rgba(0,0,0,.08);
}
.feature-label { font-size: 24rpx; color: #6B7280; font-weight: 500; }

/* 区块标题 */
.section-head {
  display: flex; justify-content: space-between; align-items: center;
  margin: 24rpx 32rpx 24rpx;
}
.section-title { font-size: 32rpx; font-weight: 700; color: #1F2937; }
.section-sub { font-size: 22rpx; color: #9CA3AF; margin-top: 4rpx; }
.more { font-size: 26rpx; color: #8B5CF6; }

.cases { white-space: nowrap; padding: 0 32rpx; }

.history {
  margin: 32rpx;
  padding: 28rpx 32rpx;
  background: linear-gradient(135deg, #F5F3FF, #FDF2F8);
  border-radius: 24rpx;
  display: flex; align-items: center; gap: 20rpx;
  border: 2rpx solid rgba(139, 92, 246, .12);
}
.history-icon {
  width: 80rpx; height: 80rpx; border-radius: 20rpx;
  background: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 40rpx;
}
.history-text { flex: 1; }
.history-title { font-size: 30rpx; font-weight: 600; color: #1F2937; }
.history-time { font-size: 24rpx; color: #6B7280; margin-top: 4rpx; }
.arrow { color: #8B5CF6; font-size: 40rpx; }
</style>
