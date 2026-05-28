<template>
  <view class="case-card">
    <view class="ba">
      <view class="half before" :style="{ background: `linear-gradient(135deg, ${data.color1}88, ${data.color2}88)` }">
        <text class="face-emoji">😶</text>
        <text class="label">Before</text>
      </view>
      <view class="half after" :style="{ background: `linear-gradient(135deg, ${data.color1}, ${data.color2})` }">
        <text class="face-emoji">🤩</text>
        <text class="label">After ✨</text>
      </view>
    </view>
    <view class="info">
      <view class="name">{{ data.name }}</view>
      <view class="tag">{{ data.tag }}</view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  data: {
    type: Object,
    default: () => ({ name: '用户', tag: '', color1: '#8B5CF6', color2: '#6D28D9' })
  }
})
</script>

<style lang="scss" scoped>
.case-card {
  display: inline-block; vertical-align: top;
  width: 320rpx; margin-right: 20rpx;
  background: #fff; border-radius: 20rpx; overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, .06);
}
.ba { display: flex; height: 360rpx; }
.half {
  flex: 1; position: relative;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.face-emoji { font-size: 80rpx; }
.label {
  position: absolute; bottom: 16rpx;
  font-size: 22rpx; color: #fff; font-weight: 600;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, .2);
}
.info { padding: 16rpx 20rpx; }
.name { font-size: 28rpx; font-weight: 600; color: #1F2937; }
.tag { font-size: 22rpx; color: #8B5CF6; margin-top: 4rpx; }
</style>
