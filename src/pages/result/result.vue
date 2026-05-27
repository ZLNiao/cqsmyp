<template>
  <view class="result">
    <!-- 用户照片 -->
    <view class="photo-wrap">
      <image class="photo" :src="photo" mode="aspectFill" />
    </view>

    <!-- 脸型 -->
    <analysis-card title="你的脸型" emoji="🟣">
      <view class="big">{{ data.faceShape.label }}</view>
      <view class="muted">特征：{{ data.faceShape.feature }}</view>
      <view class="muted">适合：{{ data.faceShape.suit }}</view>
    </analysis-card>

    <!-- 肤色 -->
    <analysis-card title="肤色分析" emoji="🟡">
      <view class="big">{{ data.skinTone.label }}</view>
      <view class="muted">肤色：{{ data.skinTone.tone }}</view>
      <view class="muted">推荐色系：{{ data.skinTone.colors }}</view>
    </analysis-card>

    <!-- 五官特征 -->
    <analysis-card title="五官特征" emoji="✨">
      <view class="grid">
        <view class="grid-item" v-for="(f, i) in data.features" :key="i">
          <text class="grid-emoji">{{ f.emoji }}</text>
          <text class="grid-label">{{ f.name }}</text>
          <text class="grid-value">{{ f.value }}</text>
        </view>
      </view>
    </analysis-card>

    <!-- 明星相似度（订阅锁） -->
    <analysis-card title="明星相似度" emoji="⭐" :locked="!isVip">
      <view class="celebs">
        <view v-for="(c, i) in data.celebs" :key="i" class="celeb">
          <view class="avatar">{{ c.emoji }}</view>
          <view class="name">{{ c.name }}</view>
          <view class="sim">{{ c.sim }}%</view>
        </view>
      </view>
    </analysis-card>

    <!-- AI 妆容建议（订阅锁）-->
    <analysis-card title="AI 妆容建议" emoji="💄" :locked="!isVip">
      <view class="big">{{ data.makeup.title }}</view>
      <view class="muted" v-for="(m, i) in data.makeup.steps" :key="i">{{ m }}</view>
    </analysis-card>

    <!-- AI 变美 CTA -->
    <view class="cta" @click="onTryAi">✨ 看看 AI 变美后的我</view>

    <!-- 底部操作栏 -->
    <view class="actions">
      <view class="action" @click="onShare">📤 分享</view>
      <view class="action" @click="onSave">💾 保存</view>
      <view class="action" @click="goSubscribe">🔓 解锁全部</view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user'

const user = useUserStore()
const isVip = ref(user.isVip)

const photo = ref('')
const data = ref({
  faceShape: { label: '心形脸', feature: '额头宽、下巴尖', suit: '柔和眉形、浅色唇妆' },
  skinTone: { label: '暖调 - 春季型', tone: '暖白皮', colors: '大地色、珊瑚色、暖橘色' },
  features: [
    { emoji: '👁️', name: '眼型', value: '杏眼' },
    { emoji: '✏️', name: '眉形', value: '标准眉' },
    { emoji: '💋', name: '唇形', value: 'M 形唇' },
    { emoji: '👃', name: '鼻型', value: '直鼻' }
  ],
  celebs: [
    { emoji: '👩', name: '明星A', sim: 85 },
    { emoji: '👩‍🦰', name: '明星B', sim: 72 },
    { emoji: '👩‍🦱', name: '明星C', sim: 65 }
  ],
  makeup: {
    title: '日常通勤妆',
    steps: [
      '底妆：轻薄粉底 + 局部遮瑕',
      '眼妆：大地色眼影 + 自然眼线',
      '唇妆：豆沙色唇釉',
      '腮红：珊瑚色斜向扫'
    ]
  }
})

onMounted(() => {
  photo.value = uni.getStorageSync('pendingPhoto') || ''
  const cached = uni.getStorageSync('lastAnalysis')
  if (cached) data.value = { ...data.value, ...cached }
})

const onTryAi = () => {
  if (!isVip.value) { goSubscribe(); return }
  uni.showToast({ title: 'AI 变美生成中...', icon: 'none' })
  // TODO: 调用 AI 换妆 API
}
const onShare = () => uni.showToast({ title: '调起分享', icon: 'none' })
const onSave = () => uni.showToast({ title: '已保存到相册', icon: 'success' })
const goSubscribe = () => uni.navigateTo({ url: '/pages/subscribe/subscribe' })
</script>

<style lang="scss" scoped>
.result { padding: 24rpx 24rpx 200rpx; }
.photo-wrap {
  width: 100%; height: 480rpx; border-radius: 24rpx; overflow: hidden;
  margin-bottom: 32rpx; background: #eee;
  .photo { width: 100%; height: 100%; }
}
.big { font-size: 44rpx; font-weight: 700; color: #1F2937; margin: 12rpx 0; }
.muted { font-size: 26rpx; color: #6B7280; margin: 6rpx 0; line-height: 1.6; }
.grid { display: flex; flex-wrap: wrap; }
.grid-item {
  width: 50%; padding: 20rpx 0;
  display: flex; align-items: center; gap: 16rpx;
}
.grid-emoji { font-size: 36rpx; }
.grid-label { font-size: 26rpx; color: #6B7280; }
.grid-value { font-size: 28rpx; color: #1F2937; font-weight: 600; }
.celebs { display: flex; gap: 24rpx; }
.celeb {
  flex: 1; text-align: center;
  .avatar {
    width: 120rpx; height: 120rpx; border-radius: 50%;
    background: #F3F4F6; line-height: 120rpx; font-size: 60rpx; margin: 0 auto;
  }
  .name { font-size: 24rpx; color: #6B7280; margin-top: 12rpx; }
  .sim { font-size: 30rpx; color: #8B5CF6; font-weight: 700; }
}
.cta {
  margin: 32rpx 8rpx; padding: 32rpx; text-align: center;
  background: linear-gradient(135deg, #8B5CF6, #6D28D9);
  color: #fff; border-radius: 24rpx; font-size: 30rpx; font-weight: 600;
  box-shadow: 0 16rpx 48rpx rgba(139, 92, 246, .3);
}
.actions {
  position: fixed; left: 0; right: 0; bottom: 0;
  background: #fff; padding: 20rpx 24rpx; padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  display: flex; gap: 16rpx; box-shadow: 0 -2rpx 12rpx rgba(0,0,0,.05);
}
.action {
  flex: 1; height: 80rpx; line-height: 80rpx; text-align: center;
  background: #F3F4F6; border-radius: 16rpx; font-size: 26rpx;
}
</style>
