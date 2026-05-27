<template>
  <view class="analysis-card" :class="{ 'is-locked': locked }">
    <view class="head">
      <view class="head-left">
        <view class="emoji-box">
          <text class="emoji">{{ emoji }}</text>
        </view>
        <text class="title">{{ title }}</text>
      </view>
      <view v-if="locked" class="lock">
        <text class="lock-icon">🔒</text>
        <text>VIP</text>
      </view>
    </view>

    <view class="body" :class="{ blur: locked }">
      <slot />
    </view>

    <!-- 锁定遮罩 -->
    <view v-if="locked" class="lock-mask" @click="onUnlock">
      <view class="lock-cta">
        <text class="lock-cta-icon">🔓</text>
        <text class="lock-cta-text">解锁查看</text>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  title: String,
  emoji: { type: String, default: '✨' },
  locked: { type: Boolean, default: false }
})

const onUnlock = () => {
  uni.navigateTo({ url: '/pages/subscribe/subscribe' })
}
</script>

<style lang="scss" scoped>
.analysis-card {
  position: relative;
  background: #fff; border-radius: 24rpx;
  padding: 32rpx; margin: 0 24rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, .04);
  overflow: hidden;
  animation: slideUp .5s ease backwards;
}

.head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24rpx;
}
.head-left { display: flex; align-items: center; gap: 16rpx; }
.emoji-box {
  width: 56rpx; height: 56rpx; border-radius: 16rpx;
  background: linear-gradient(135deg, #F5F3FF, #FDF2F8);
  display: flex; align-items: center; justify-content: center;
}
.emoji { font-size: 32rpx; }
.title { font-size: 30rpx; font-weight: 700; color: #1F2937; }

.lock {
  display: flex; align-items: center; gap: 4rpx;
  padding: 6rpx 16rpx; background: linear-gradient(135deg, #FEF3C7, #FDE68A);
  color: #92400E; border-radius: 16rpx; font-size: 22rpx; font-weight: 600;
}
.lock-icon { font-size: 22rpx; }

.body {
  &.blur { filter: blur(8rpx); pointer-events: none; user-select: none; }
}

.lock-mask {
  position: absolute; left: 0; right: 0; bottom: 0; height: 60%;
  background: linear-gradient(180deg, rgba(255,255,255,.4) 0%, rgba(255,255,255,.95) 50%);
  display: flex; align-items: flex-end; justify-content: center; padding-bottom: 32rpx;
  backdrop-filter: blur(2rpx);
}
.lock-cta {
  display: flex; align-items: center; gap: 12rpx;
  padding: 16rpx 32rpx;
  background: linear-gradient(135deg, #8B5CF6, #6D28D9);
  color: #fff; border-radius: 32rpx; font-size: 26rpx; font-weight: 600;
  box-shadow: 0 8rpx 24rpx rgba(139, 92, 246, .4);
}
.lock-cta-icon { font-size: 28rpx; }

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
