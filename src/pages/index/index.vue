<template>
  <view class="home">
    <!-- 顶部导航 -->
    <view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <text class="logo">GlamUp ✨</text>
      <text class="bell">🔔</text>
    </view>

    <!-- 上传卡片 -->
    <upload-card @pick="onPickPhoto" />

    <!-- 案例横滑 -->
    <view class="section-title">看看她们的变化</view>
    <scroll-view class="cases" scroll-x>
      <case-card v-for="i in 5" :key="i" :index="i" />
    </scroll-view>

    <!-- 历史入口 -->
    <view v-if="lastResult" class="history" @click="goResult">
      <text>上次分析结果</text>
      <text class="arrow">›</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const statusBarHeight = ref(20)
const lastResult = ref(null)

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
  // 首次启动跳引导页
  if (!uni.getStorageSync('onboarded')) {
    uni.reLaunch({ url: '/pages/onboard/onboard' })
  }
})

onShow(() => {
  lastResult.value = uni.getStorageSync('lastAnalysis') || null
})

const onPickPhoto = (sourceType) => {
  uni.chooseImage({
    sourceType: [sourceType], // 'camera' 或 'album'
    count: 1,
    success: (res) => {
      const path = res.tempFilePaths[0]
      uni.setStorageSync('pendingPhoto', path)
      uni.navigateTo({ url: '/pages/info/info' })
    },
    fail: (err) => {
      console.log('选择图片失败', err)
    }
  })
}

const goResult = () => {
  uni.navigateTo({ url: '/pages/result/result' })
}
</script>

<style lang="scss" scoped>
.home {
  min-height: 100vh;
  padding-bottom: 120rpx;
}
.navbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 24rpx 32rpx;
  .logo { font-size: 40rpx; font-weight: 700; background: linear-gradient(135deg, #8B5CF6, #6D28D9); -webkit-background-clip: text; color: transparent; }
  .bell { font-size: 36rpx; }
}
.section-title {
  margin: 48rpx 32rpx 24rpx;
  font-size: 30rpx; font-weight: 600; color: #1F2937;
}
.cases {
  white-space: nowrap; padding: 0 32rpx;
}
.history {
  margin: 32rpx;
  padding: 28rpx 32rpx;
  background: #fff; border-radius: 16rpx;
  display: flex; justify-content: space-between; align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,.04);
  font-size: 28rpx; color: #6B7280;
  .arrow { color: #9CA3AF; font-size: 36rpx; }
}
</style>
