<template>
  <view class="page">
    <view class="bg-blob bg-1" />
    <view class="bg-blob bg-2" />

    <!-- Hero -->
    <view class="hero">
      <view class="back" @click="onBack">‹</view>
      <view class="title">✨ AI 一键变美</view>
      <view class="sub">选择心仪风格，让 AI 为你定制专属妆容</view>
    </view>

    <!-- Before/After 区 -->
    <view class="ba-card" v-if="resultUrl">
      <view class="ba-stage">
        <!-- 左：原图 -->
        <image class="ba-img" :src="originalUrl" mode="aspectFill" />
        <!-- 右：AI 图（通过滑块控制宽度） -->
        <view class="ba-after" :style="{ width: sliderPos + '%' }">
          <image class="ba-img" :src="resultUrl" mode="aspectFill" />
        </view>
        <!-- 滑动条 -->
        <view
          class="slider-bar"
          :style="{ left: sliderPos + '%' }"
          @touchmove.prevent="onSliderTouch"
        >
          <view class="slider-handle">⇄</view>
        </view>
        <!-- 标签 -->
        <view class="ba-label left">Before</view>
        <view class="ba-label right">After ✨</view>
      </view>
      <view class="ba-info">
        <view class="ba-style">{{ currentStyleInfo.emoji }} {{ currentStyleInfo.name }}</view>
        <view class="ba-desc">{{ currentStyleInfo.desc }}</view>
      </view>
    </view>

    <!-- 加载中 -->
    <view class="loading-card" v-else-if="loading">
      <view class="loading-photo">
        <image v-if="originalUrl" class="loading-img" :src="originalUrl" mode="aspectFill" />
        <view class="loading-mask">
          <view class="loading-spinner" />
          <text class="loading-text">AI 正在为你上妆...</text>
          <text class="loading-tip">通常需要 5~15 秒</text>
        </view>
      </view>
    </view>

    <!-- 风格选择 -->
    <view class="styles-section">
      <view class="section-title">选择妆容风格</view>
      <view class="styles">
        <view
          v-for="s in styles"
          :key="s.key"
          class="style-card"
          :class="{ active: selectedKey === s.key }"
          @click="selectedKey = s.key"
        >
          <view class="style-emoji">{{ s.emoji }}</view>
          <view class="style-name">{{ s.name }}</view>
          <view class="style-desc">{{ s.desc }}</view>
          <view v-if="selectedKey === s.key" class="style-check">✓</view>
        </view>
      </view>
    </view>

    <!-- 操作栏 -->
    <view class="actions">
      <button v-if="!resultUrl" class="btn primary" :loading="loading" @click="onGenerate">
        ✨ 生成 AI 妆容
      </button>
      <template v-else>
        <view class="action-btn" @click="onSave">💾 保存到相册</view>
        <view class="action-btn" @click="onShare">📤 分享</view>
        <view class="action-btn primary" @click="onTryAgain">🔄 换个风格</view>
      </template>
    </view>

    <!-- VIP 提示弹窗 -->
    <view v-if="showVipModal" class="vip-modal" @click.self="showVipModal = false">
      <view class="vip-modal-content">
        <view class="vip-emoji">👑</view>
        <view class="vip-title">VIP 专享功能</view>
        <view class="vip-desc">AI 换妆是会员专属，开通后可无限次生成</view>
        <button class="btn primary" @click="goSubscribe">立即开通</button>
        <view class="vip-cancel" @click="showVipModal = false">暂不开通</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { generateAiMakeup, getMakeupStyles } from '@/api/analysis'

const user = useUserStore()

const styles = ref([])
const selectedKey = ref('daily')
const originalUrl = ref('')
const resultUrl = ref('')
const loading = ref(false)
const showVipModal = ref(false)

const sliderPos = ref(50) // 0~100 对比滑块位置

const currentStyleInfo = computed(() =>
  styles.value.find((s) => s.key === selectedKey.value) || { emoji: '✨', name: '', desc: '' }
)

onMounted(async () => {
  // 取上次分析时使用的照片
  originalUrl.value = uni.getStorageSync('pendingPhoto') || ''
  if (!originalUrl.value) {
    uni.showToast({ title: '请先回到首页选择照片', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
    return
  }

  // 拉风格列表
  try {
    const data = await getMakeupStyles()
    styles.value = data.list
  } catch (e) {
    // 失败用本地兜底
    styles.value = [
      { key: 'daily', emoji: '☀️', name: '日常通勤妆', desc: '自然清透、显气色' },
      { key: 'date', emoji: '💗', name: '约会甜心妆', desc: '元气可爱、桃花气' },
      { key: 'retro', emoji: '🌹', name: '复古港风妆', desc: '高级浓郁、电影感' },
      { key: 'cool', emoji: '❄️', name: '清冷御姐妆', desc: '冷调高级、气场全开' }
    ]
  }
})

const onGenerate = async () => {
  // VIP 校验
  if (!user.isVip) {
    showVipModal.value = true
    return
  }
  if (!originalUrl.value) {
    return uni.showToast({ title: '没有原图', icon: 'none' })
  }

  loading.value = true
  resultUrl.value = ''

  try {
    const result = await generateAiMakeup(originalUrl.value, selectedKey.value)
    resultUrl.value = result.resultUrl
    sliderPos.value = 100 // 默认显示完整 After
    setTimeout(() => { sliderPos.value = 50 }, 600) // 缓慢移到中间制造对比效果
  } catch (e) {
    // request.js 已弹错误
  } finally {
    loading.value = false
  }
}

const onTryAgain = () => {
  resultUrl.value = ''
}

const onSave = () => {
  if (!resultUrl.value) return
  uni.saveImageToPhotosAlbum({
    filePath: resultUrl.value,
    success: () => uni.showToast({ title: '已保存到相册', icon: 'success' }),
    fail: () => uni.showToast({ title: '保存失败', icon: 'none' })
  })
}

const onShare = () => {
  uni.showToast({ title: '调起分享', icon: 'none' })
  // 真实环境调 uni.share({ ... })
}

const goSubscribe = () => {
  showVipModal.value = false
  uni.navigateTo({ url: '/pages/subscribe/subscribe' })
}

const onBack = () => uni.navigateBack()

/** 滑块拖动 */
const onSliderTouch = (e) => {
  const stage = uni.createSelectorQuery().select('.ba-stage')
  stage.boundingClientRect((rect) => {
    if (!rect) return
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
    sliderPos.value = pct
  }).exec()
}
</script>

<style lang="scss" scoped>
.page {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(180deg, #FAF5FF 0%, #FDF2F8 50%, #F8F9FA 100%);
  padding-bottom: 200rpx;
  overflow: hidden;
}
.bg-blob {
  position: absolute; border-radius: 50%; filter: blur(80rpx); opacity: .5;
  pointer-events: none;
}
.bg-1 { width: 400rpx; height: 400rpx; background: #C4B5FD; top: -100rpx; right: -100rpx; }
.bg-2 { width: 350rpx; height: 350rpx; background: #FBCFE8; top: 400rpx; left: -100rpx; }

/* Hero */
.hero {
  position: relative; z-index: 2;
  padding: 80rpx 32rpx 24rpx;
  text-align: center;
}
.back {
  position: absolute; left: 20rpx; top: 80rpx;
  width: 64rpx; height: 64rpx; line-height: 56rpx;
  font-size: 56rpx; color: #6B7280; text-align: center;
}
.title {
  font-size: 44rpx; font-weight: 800;
  background: linear-gradient(135deg, #8B5CF6, #EC4899);
  -webkit-background-clip: text; color: transparent;
}
.sub { font-size: 26rpx; color: #6B7280; margin-top: 12rpx; }

/* Before/After */
.ba-card {
  margin: 32rpx 24rpx;
  position: relative; z-index: 2;
  background: #fff; border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 12rpx 40rpx rgba(139, 92, 246, .15);
}
.ba-stage {
  position: relative;
  width: 100%; aspect-ratio: 1;
  background: #000;
}
.ba-img {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  display: block;
}
.ba-after {
  position: absolute; top: 0; right: 0; bottom: 0;
  overflow: hidden;
  /* width 由 sliderPos 反向算（实际是 left=sliderPos%）*/
}
.ba-after .ba-img {
  /* 为避免镜像问题，让 after 图也始终是完整尺寸但只显示部分 */
  position: absolute; top: 0; right: 0;
  width: calc(100vw - 48rpx);
  height: 100%;
  object-fit: cover;
}
.slider-bar {
  position: absolute; top: 0; bottom: 0;
  width: 4rpx; background: #fff;
  transform: translateX(-50%);
  box-shadow: 0 0 16rpx rgba(0, 0, 0, .3);
  z-index: 5;
}
.slider-handle {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 64rpx; height: 64rpx; border-radius: 50%;
  background: #fff; color: #8B5CF6;
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx; font-weight: 700;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, .2);
}
.ba-label {
  position: absolute; top: 24rpx;
  padding: 8rpx 20rpx; border-radius: 24rpx;
  background: rgba(0, 0, 0, .5); color: #fff;
  font-size: 22rpx; font-weight: 600;
  backdrop-filter: blur(10rpx);
}
.ba-label.left { left: 24rpx; }
.ba-label.right {
  right: 24rpx;
  background: linear-gradient(135deg, #8B5CF6, #EC4899);
}

.ba-info { padding: 24rpx 32rpx; }
.ba-style {
  font-size: 32rpx; font-weight: 700; color: #1F2937;
}
.ba-desc { font-size: 24rpx; color: #6B7280; margin-top: 8rpx; }

/* 加载中 */
.loading-card {
  margin: 32rpx 24rpx; position: relative; z-index: 2;
  background: #fff; border-radius: 24rpx; overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, .06);
}
.loading-photo {
  position: relative;
  width: 100%; aspect-ratio: 1;
  background: #F3F4F6;
}
.loading-img {
  width: 100%; height: 100%;
  filter: blur(8rpx);
}
.loading-mask {
  position: absolute; inset: 0;
  background: rgba(139, 92, 246, .85);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 24rpx; color: #fff;
}
.loading-spinner {
  width: 80rpx; height: 80rpx;
  border: 6rpx solid rgba(255, 255, 255, .3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
.loading-text { font-size: 32rpx; font-weight: 700; }
.loading-tip { font-size: 24rpx; opacity: .85; }

@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }

/* 风格选择 */
.styles-section { margin: 32rpx 24rpx; position: relative; z-index: 2; }
.section-title {
  font-size: 30rpx; font-weight: 700; color: #1F2937;
  margin-bottom: 20rpx;
}
.styles {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx;
}
.style-card {
  position: relative;
  background: #fff; border-radius: 20rpx;
  padding: 32rpx 20rpx;
  border: 4rpx solid transparent;
  text-align: center;
  transition: all .2s;
  &.active {
    border-color: #8B5CF6;
    background: linear-gradient(180deg, #FAF5FF, #fff);
    box-shadow: 0 12rpx 32rpx rgba(139, 92, 246, .2);
    transform: translateY(-4rpx);
  }
}
.style-emoji { font-size: 56rpx; margin-bottom: 12rpx; }
.style-name { font-size: 28rpx; font-weight: 700; color: #1F2937; }
.style-desc { font-size: 22rpx; color: #6B7280; margin-top: 6rpx; }
.style-check {
  position: absolute; top: 12rpx; right: 12rpx;
  width: 36rpx; height: 36rpx; border-radius: 50%;
  background: #8B5CF6; color: #fff; font-size: 20rpx;
  display: flex; align-items: center; justify-content: center;
}

/* 操作栏 */
.actions {
  position: fixed; left: 0; right: 0; bottom: 0;
  background: #fff;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  display: flex; gap: 16rpx;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, .06);
  z-index: 10;
}
.btn.primary {
  flex: 1;
  height: 88rpx; line-height: 88rpx;
  background: linear-gradient(135deg, #8B5CF6, #6D28D9);
  color: #fff; border-radius: 44rpx;
  font-size: 30rpx; font-weight: 700; border: none;
  box-shadow: 0 8rpx 24rpx rgba(139, 92, 246, .4);
}
.action-btn {
  flex: 1; height: 88rpx; border-radius: 16rpx;
  background: #F3F4F6; font-size: 26rpx; color: #1F2937;
  display: flex; align-items: center; justify-content: center;
  &.primary {
    flex: 1.5;
    background: linear-gradient(135deg, #8B5CF6, #6D28D9);
    color: #fff; font-weight: 600;
  }
}

/* VIP 弹窗 */
.vip-modal {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0, 0, 0, .5);
  display: flex; align-items: center; justify-content: center;
  padding: 0 60rpx;
}
.vip-modal-content {
  width: 100%; background: #fff;
  border-radius: 32rpx;
  padding: 48rpx 32rpx;
  text-align: center;
}
.vip-emoji { font-size: 96rpx; margin-bottom: 16rpx; }
.vip-title { font-size: 36rpx; font-weight: 700; color: #1F2937; }
.vip-desc { font-size: 26rpx; color: #6B7280; margin: 12rpx 0 32rpx; line-height: 1.6; }
.vip-cancel {
  margin-top: 24rpx; font-size: 26rpx; color: #9CA3AF;
}
</style>
