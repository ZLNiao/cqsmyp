<template>
  <view class="onboard">
    <swiper class="swiper" :indicator-dots="false" :current="current" @change="onChange">
      <swiper-item v-for="(item, idx) in slides" :key="idx" class="slide">
        <view class="emoji">{{ item.emoji }}</view>
        <view class="title">{{ item.title }}</view>
        <view class="desc">{{ item.desc }}</view>
      </swiper-item>
    </swiper>

    <view class="dots">
      <view v-for="(_, idx) in slides" :key="idx" class="dot" :class="{ active: idx === current }" />
    </view>

    <button class="btn" @click="onNext">{{ current === slides.length - 1 ? '开始变美 🚀' : '下一步' }}</button>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const current = ref(0)
const slides = [
  { emoji: '📸', title: '拍一张自拍', desc: '上传照片，AI 自动分析\n你的脸型和肤色' },
  { emoji: '🎨', title: '找到你的风格', desc: '色彩分析 + 妆容推荐\n找到最适合你的搭配' },
  { emoji: '✨', title: '变美前后对比', desc: 'AI 一键生成妆容效果\n看到变美后的自己' }
]

const onChange = (e) => { current.value = e.detail.current }

const onNext = () => {
  if (current.value < slides.length - 1) {
    current.value += 1
  } else {
    uni.setStorageSync('onboarded', true)
    uni.reLaunch({ url: '/pages/index/index' })
  }
}
</script>

<style lang="scss" scoped>
.onboard {
  min-height: 100vh;
  background: linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200rpx 60rpx 80rpx;
  box-sizing: border-box;
}
.swiper { width: 100%; height: 700rpx; }
.slide {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.emoji { font-size: 160rpx; margin-bottom: 60rpx; }
.title {
  font-size: 56rpx; font-weight: 700; color: #1F2937; margin-bottom: 32rpx;
}
.desc {
  font-size: 30rpx; color: #6B7280; text-align: center; line-height: 1.8; white-space: pre-line;
}
.dots { display: flex; gap: 16rpx; margin: 40rpx 0 60rpx; }
.dot {
  width: 16rpx; height: 16rpx; border-radius: 50%;
  background: #E5E7EB; transition: all .2s;
  &.active { width: 48rpx; border-radius: 8rpx; background: #8B5CF6; }
}
.btn {
  width: 100%; height: 96rpx; line-height: 96rpx;
  background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
  color: #fff; border-radius: 48rpx; font-size: 32rpx; font-weight: 600;
  border: none;
}
</style>
