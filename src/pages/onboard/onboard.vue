<template>
  <view class="onboard">
    <!-- 背景装饰光斑 -->
    <view class="blob blob-1" />
    <view class="blob blob-2" />
    <view class="blob blob-3" />

    <!-- 顶部跳过 + 进度 -->
    <view class="top-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="progress">
        <view class="progress-bar" :style="{ width: ((current + 1) / slides.length * 100) + '%' }" />
      </view>
      <text class="skip" @click="onSkip">跳过</text>
    </view>

    <swiper class="swiper" :indicator-dots="false" :current="current" @change="onChange" :duration="400">
      <swiper-item v-for="(item, idx) in slides" :key="idx" class="slide">
        <view class="illustration" :class="`illu-${idx}`">
          <view class="illu-bg" />
          <text class="illu-emoji">{{ item.emoji }}</text>
          <text v-for="dot in 6" :key="dot" class="sparkle" :class="`s-${dot}`">✨</text>
        </view>
        <view class="badge">{{ item.tag }}</view>
        <view class="title">{{ item.title }}</view>
        <view class="desc">{{ item.desc }}</view>
      </swiper-item>
    </swiper>

    <view class="dots">
      <view v-for="(_, idx) in slides" :key="idx" class="dot" :class="{ active: idx === current }" />
    </view>

    <button class="btn" @click="onNext">
      {{ current === slides.length - 1 ? '开始变美' : '下一步' }}
      <text class="btn-arrow">{{ current === slides.length - 1 ? ' 🚀' : ' →' }}</text>
    </button>
    <view class="agreement">登录即代表同意《用户协议》和《隐私政策》</view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const current = ref(0)
const statusBarHeight = ref(20)

const slides = [
  { emoji: '📸', tag: '第 1 步', title: '拍一张自拍', desc: '上传照片，AI 自动分析\n你的脸型和肤色' },
  { emoji: '🎨', tag: '第 2 步', title: '找到你的风格', desc: '色彩分析 + 妆容推荐\n找到最适合你的搭配' },
  { emoji: '✨', tag: '第 3 步', title: '变美前后对比', desc: 'AI 一键生成妆容效果\n看到变美后的自己' }
]

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
})

const onChange = (e) => { current.value = e.detail.current }

const onNext = () => {
  if (current.value < slides.length - 1) {
    current.value += 1
  } else {
    finish()
  }
}

const onSkip = () => finish()

const finish = () => {
  uni.setStorageSync('onboarded', true)
  uni.reLaunch({ url: '/pages/index/index' })
}
</script>

<style lang="scss" scoped>
.onboard {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 60%, #FDF2F8 100%);
  display: flex;
  flex-direction: column;
  padding: 0 60rpx 80rpx;
  box-sizing: border-box;
  overflow: hidden;
}
/* 装饰光斑 */
.blob {
  position: absolute; border-radius: 50%; filter: blur(60rpx); opacity: .5;
  pointer-events: none;
}
.blob-1 { width: 500rpx; height: 500rpx; background: #C4B5FD; top: -100rpx; right: -150rpx; }
.blob-2 { width: 400rpx; height: 400rpx; background: #FBCFE8; bottom: 200rpx; left: -120rpx; }
.blob-3 { width: 300rpx; height: 300rpx; background: #DDD6FE; top: 50%; right: 20%; }

/* 顶部 */
.top-bar {
  display: flex; align-items: center; gap: 24rpx; padding-bottom: 24rpx; padding-top: 24rpx;
}
.progress {
  flex: 1; height: 8rpx; background: rgba(139, 92, 246, .15); border-radius: 4rpx; overflow: hidden;
}
.progress-bar {
  height: 100%; background: linear-gradient(90deg, #8B5CF6, #EC4899);
  border-radius: 4rpx; transition: width .4s ease;
}
.skip { font-size: 26rpx; color: #6B7280; padding: 8rpx 16rpx; }

/* swiper 内容 */
.swiper { width: 100%; height: 760rpx; flex-shrink: 0; }
.slide {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding-top: 40rpx;
}
.illustration {
  position: relative; width: 360rpx; height: 360rpx; margin-bottom: 60rpx;
  display: flex; align-items: center; justify-content: center;
  animation: float 3s ease-in-out infinite;
}
.illu-bg {
  position: absolute; inset: 0; border-radius: 50%;
  background: linear-gradient(135deg, #F0ABFC, #C4B5FD);
  box-shadow: 0 24rpx 60rpx rgba(139, 92, 246, .3);
}
.illu-1 .illu-bg { background: linear-gradient(135deg, #FDE68A, #FBA74D); box-shadow: 0 24rpx 60rpx rgba(251, 167, 77, .3); }
.illu-2 .illu-bg { background: linear-gradient(135deg, #F9A8D4, #C4B5FD); box-shadow: 0 24rpx 60rpx rgba(236, 72, 153, .3); }
.illu-emoji { position: relative; font-size: 200rpx; z-index: 2; }
.sparkle {
  position: absolute; font-size: 28rpx; opacity: .8;
  animation: twinkle 2s ease-in-out infinite;
}
.s-1 { top: 10rpx; left: 30rpx; animation-delay: 0s; }
.s-2 { top: 50rpx; right: 20rpx; animation-delay: .3s; }
.s-3 { bottom: 60rpx; left: 10rpx; animation-delay: .6s; }
.s-4 { bottom: 20rpx; right: 60rpx; animation-delay: .9s; }
.s-5 { top: 50%; left: -20rpx; animation-delay: 1.2s; }
.s-6 { top: 50%; right: -20rpx; animation-delay: 1.5s; }

.badge {
  display: inline-block; padding: 8rpx 24rpx;
  background: rgba(139, 92, 246, .12); color: #8B5CF6;
  border-radius: 32rpx; font-size: 24rpx; font-weight: 600;
  margin-bottom: 24rpx;
}
.title {
  font-size: 56rpx; font-weight: 700; color: #1F2937; margin-bottom: 24rpx;
  letter-spacing: 2rpx;
}
.desc {
  font-size: 30rpx; color: #6B7280; text-align: center; line-height: 1.8; white-space: pre-line;
}

.dots { display: flex; gap: 16rpx; justify-content: center; margin: 40rpx 0 48rpx; }
.dot {
  width: 16rpx; height: 16rpx; border-radius: 50%;
  background: #E5E7EB; transition: all .3s;
  &.active {
    width: 64rpx; border-radius: 8rpx;
    background: linear-gradient(90deg, #8B5CF6, #EC4899);
  }
}

.btn {
  height: 96rpx; line-height: 96rpx;
  background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
  color: #fff; border-radius: 48rpx; font-size: 32rpx; font-weight: 600; border: none;
  box-shadow: 0 16rpx 40rpx rgba(139, 92, 246, .4);
}
.btn-arrow { display: inline-block; }
.agreement { text-align: center; font-size: 22rpx; color: #9CA3AF; margin-top: 24rpx; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-16rpx); }
}
@keyframes twinkle {
  0%, 100% { opacity: .3; transform: scale(.8); }
  50% { opacity: 1; transform: scale(1.2); }
}
</style>
