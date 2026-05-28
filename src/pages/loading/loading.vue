<template>
  <view class="loading">
    <view class="bg-blob bg-1" />
    <view class="bg-blob bg-2" />

    <view class="photo-stage">
      <image v-if="photo" class="photo" :src="photo" mode="aspectFill" />
      <view v-else class="photo-placeholder">📸</view>
      <!-- 扫描线 -->
      <view class="scan-line" />
      <!-- 扫描框 -->
      <view class="scan-corners">
        <view class="corner tl" />
        <view class="corner tr" />
        <view class="corner bl" />
        <view class="corner br" />
      </view>
    </view>

    <view class="title">{{ done ? '分析完成 ✨' : 'AI 正在分析中...' }}</view>

    <view class="progress-list">
      <view
        v-for="(s, i) in steps"
        :key="i"
        class="step"
        :class="{ done: i < activeIdx, active: i === activeIdx && !done }"
      >
        <view class="step-icon">
          <text v-if="i < activeIdx || done">✓</text>
          <view v-else-if="i === activeIdx" class="loading-dot" />
        </view>
        <text class="step-text">{{ s }}</text>
      </view>
    </view>

    <view v-if="errorMsg" class="error">
      <text class="error-emoji">⚠️</text>
      <text>{{ errorMsg }}</text>
      <view class="retry" @click="retry">点击重试</view>
    </view>
    <view v-else class="tip">通常需要 5~10 秒，请稍候</view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { analyzeFace } from '@/api/analysis'

const photo = ref('')
const activeIdx = ref(0)
const done = ref(false)
const errorMsg = ref('')

const steps = [
  '上传照片到云端...',
  '人脸检测中...',
  '识别脸型轮廓...',
  '分析肤色调性...',
  '生成色彩季型...',
  'AI 撰写妆容方案...'
]

let stepTimer = null

const advance = () => {
  if (activeIdx.value < steps.length - 1) {
    activeIdx.value += 1
  }
}

const start = async () => {
  errorMsg.value = ''
  activeIdx.value = 0
  done.value = false

  photo.value = uni.getStorageSync('pendingPhoto') || ''
  const userInfo = uni.getStorageSync('userInfo') || {}

  if (!photo.value) {
    errorMsg.value = '未找到照片，请重新选择'
    return
  }

  // 视觉进度（每 1.5s 推进一步，让用户感觉有事在做）
  stepTimer = setInterval(advance, 1500)

  try {
    const result = await analyzeFace(photo.value, userInfo)
    if (stepTimer) { clearInterval(stepTimer); stepTimer = null }
    activeIdx.value = steps.length
    done.value = true

    uni.setStorageSync('lastAnalysis', result)

    // 短暂展示完成状态后跳转
    setTimeout(() => {
      uni.redirectTo({ url: '/pages/result/result' })
    }, 600)
  } catch (e) {
    if (stepTimer) { clearInterval(stepTimer); stepTimer = null }
    errorMsg.value = e?.message || '分析失败，请检查网络或重试'
  }
}

const retry = () => start()

onMounted(start)
onUnmounted(() => { if (stepTimer) clearInterval(stepTimer) })
</script>

<style lang="scss" scoped>
.loading {
  position: relative; min-height: 100vh;
  background: linear-gradient(180deg, #FAF5FF 0%, #F8F9FA 100%);
  display: flex; flex-direction: column; align-items: center;
  padding: 120rpx 60rpx 80rpx; overflow: hidden;
}
.bg-blob {
  position: absolute; border-radius: 50%; filter: blur(80rpx); opacity: .4;
  pointer-events: none;
}
.bg-1 { width: 400rpx; height: 400rpx; background: #C4B5FD; top: 100rpx; right: -100rpx; }
.bg-2 { width: 400rpx; height: 400rpx; background: #FBCFE8; bottom: 200rpx; left: -100rpx; }

.photo-stage {
  position: relative;
  width: 380rpx; height: 380rpx; border-radius: 32rpx;
  overflow: hidden; margin-bottom: 60rpx;
  box-shadow: 0 16rpx 48rpx rgba(139, 92, 246, .25);
}
.photo, .photo-placeholder {
  width: 100%; height: 100%;
}
.photo-placeholder {
  background: #F3F4F6;
  display: flex; align-items: center; justify-content: center;
  font-size: 80rpx;
}
.scan-line {
  position: absolute; left: 0; right: 0; height: 4rpx;
  background: linear-gradient(90deg, transparent, #8B5CF6, transparent);
  box-shadow: 0 0 24rpx #8B5CF6;
  animation: scan 2s ease-in-out infinite;
}
.scan-corners {
  position: absolute; inset: 0; pointer-events: none;
}
.corner {
  position: absolute; width: 60rpx; height: 60rpx;
  border-color: #8B5CF6; border-style: solid; border-width: 0;
}
.corner.tl { top: 0; left: 0; border-top-width: 6rpx; border-left-width: 6rpx; border-radius: 16rpx 0 0 0; }
.corner.tr { top: 0; right: 0; border-top-width: 6rpx; border-right-width: 6rpx; border-radius: 0 16rpx 0 0; }
.corner.bl { bottom: 0; left: 0; border-bottom-width: 6rpx; border-left-width: 6rpx; border-radius: 0 0 0 16rpx; }
.corner.br { bottom: 0; right: 0; border-bottom-width: 6rpx; border-right-width: 6rpx; border-radius: 0 0 16rpx 0; }

.title {
  font-size: 40rpx; font-weight: 700; color: #1F2937; margin-bottom: 40rpx;
}

.progress-list {
  width: 100%; background: #fff; border-radius: 24rpx;
  padding: 28rpx; gap: 8rpx; display: flex; flex-direction: column;
}
.step {
  display: flex; align-items: center; gap: 20rpx;
  padding: 12rpx 0;
}
.step-icon {
  width: 40rpx; height: 40rpx; border-radius: 50%;
  background: #E5E7EB; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 22rpx; font-weight: 700;
  flex-shrink: 0;
}
.step.done .step-icon { background: #10B981; }
.step.active .step-icon { background: linear-gradient(135deg, #8B5CF6, #EC4899); }
.loading-dot {
  width: 12rpx; height: 12rpx; border-radius: 50%; background: #fff;
  animation: pulse 1s ease-in-out infinite;
}
.step-text { font-size: 26rpx; color: #9CA3AF; }
.step.done .step-text, .step.active .step-text { color: #1F2937; font-weight: 600; }

.tip { margin-top: 32rpx; font-size: 24rpx; color: #9CA3AF; }
.error {
  margin-top: 40rpx; padding: 24rpx 32rpx;
  background: #FEF2F2; border-radius: 16rpx;
  display: flex; flex-direction: column; align-items: center; gap: 12rpx;
  color: #DC2626; font-size: 26rpx; max-width: 100%;
}
.error-emoji { font-size: 48rpx; }
.retry {
  padding: 12rpx 32rpx; background: linear-gradient(135deg, #8B5CF6, #6D28D9);
  color: #fff; border-radius: 32rpx; font-size: 24rpx; font-weight: 600;
  margin-top: 8rpx;
}

@keyframes scan {
  0% { top: 0; }
  100% { top: 100%; }
}
@keyframes pulse {
  0%, 100% { transform: scale(.8); opacity: .6; }
  50% { transform: scale(1.4); opacity: 1; }
}
</style>
