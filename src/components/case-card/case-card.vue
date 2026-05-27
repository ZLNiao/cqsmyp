<template>
  <view class="case-card">
    <view class="before-after">
      <view class="half before">Before</view>
      <view class="half after">After ✨</view>
    </view>
    <view class="caption">用户 {{ index }}</view>
  </view>
</template>

<script setup>
defineProps({
  index: { type: [Number, String], default: 1 }
})
</script>

<style lang="scss" scoped>
.case-card {
  display: inline-block; vertical-align: top;
  width: 280rpx; margin-right: 20rpx;
}
.before-after {
  display: flex; height: 320rpx; border-radius: 16rpx; overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, .06);
}
.half {
  flex: 1; display: flex; align-items: center; justify-content: center;
  font-size: 24rpx; color: #fff;
}
.before { background: linear-gradient(135deg, #9CA3AF, #6B7280); }
.after { background: linear-gradient(135deg, #8B5CF6, #6D28D9); }
.caption {
  margin-top: 12rpx; font-size: 24rpx; color: #6B7280; text-align: center;
}
</style>
