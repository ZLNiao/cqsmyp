<template>
  <view class="analysis-card">
    <view class="head">
      <text class="emoji">{{ emoji }}</text>
      <text class="title">{{ title }}</text>
      <text v-if="locked" class="lock">🔒 VIP</text>
    </view>
    <view class="body" :class="{ blur: locked }">
      <slot />
    </view>
  </view>
</template>

<script setup>
defineProps({
  title: String,
  emoji: { type: String, default: '✨' },
  locked: { type: Boolean, default: false }
})
</script>

<style lang="scss" scoped>
.analysis-card {
  background: #fff; border-radius: 24rpx;
  padding: 32rpx; margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, .04);
}
.head {
  display: flex; align-items: center; gap: 12rpx; margin-bottom: 20rpx;
}
.emoji { font-size: 32rpx; }
.title { font-size: 30rpx; font-weight: 700; color: #1F2937; }
.lock {
  margin-left: auto; padding: 4rpx 16rpx;
  background: #FEF3C7; color: #92400E;
  border-radius: 16rpx; font-size: 22rpx;
}
.body {
  &.blur { filter: blur(8rpx); pointer-events: none; user-select: none; }
}
</style>
