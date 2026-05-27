<template>
  <view class="upload-card">
    <view class="emoji">📷</view>
    <view class="hint">点击拍照 / 从相册选择照片</view>
    <view class="buttons">
      <button class="btn primary" @click="$emit('pick', 'camera')">📷 拍一张</button>
      <button class="btn ghost" @click="$emit('pick', 'album')">🖼️ 从相册选择</button>
    </view>
  </view>
</template>

<script setup>
defineEmits(['pick'])
</script>

<style lang="scss" scoped>
.upload-card {
  margin: 32rpx;
  padding: 60rpx 40rpx;
  background: #fff;
  border-radius: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, .04);
  text-align: center;
}
.emoji { font-size: 96rpx; margin-bottom: 24rpx; }
.hint { color: #6B7280; font-size: 26rpx; margin-bottom: 32rpx; }
.buttons { display: flex; flex-direction: column; gap: 20rpx; }
.btn {
  height: 88rpx; line-height: 88rpx; border-radius: 44rpx;
  font-size: 30rpx; font-weight: 600; border: none;
}
.btn.primary {
  background: linear-gradient(135deg, #8B5CF6, #6D28D9);
  color: #fff;
}
.btn.ghost {
  background: #F3F4F6; color: #1F2937;
}
</style>
