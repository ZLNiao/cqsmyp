<template>
  <view class="upload-card">
    <!-- 装饰圈 -->
    <view class="ring ring-1" />
    <view class="ring ring-2" />

    <view class="emoji-wrap">
      <view class="emoji-bg" />
      <text class="emoji">📷</text>
    </view>

    <view class="title">开始你的美颜之旅</view>
    <view class="hint">拍摄或上传一张正面照\nAI 将为你生成专属分析报告</view>

    <view class="buttons">
      <button class="btn primary" @click="$emit('pick', 'camera')">
        <text class="btn-emoji">📷</text>
        <text>拍一张</text>
      </button>
      <button class="btn ghost" @click="$emit('pick', 'album')">
        <text class="btn-emoji">🖼️</text>
        <text>从相册选择</text>
      </button>
    </view>

    <view class="trust">
      <text class="trust-emoji">🔒</text>
      <text>照片仅用于分析，不会上传保存</text>
    </view>
  </view>
</template>

<script setup>
defineEmits(['pick'])
</script>

<style lang="scss" scoped>
.upload-card {
  position: relative;
  margin: 0 32rpx;
  padding: 60rpx 40rpx 40rpx;
  background: #fff;
  border-radius: 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(139, 92, 246, .08);
  text-align: center;
  overflow: hidden;
}
.ring {
  position: absolute; border-radius: 50%; border: 2rpx dashed rgba(139, 92, 246, .15);
  pointer-events: none;
}
.ring-1 { width: 600rpx; height: 600rpx; top: -200rpx; left: 50%; transform: translateX(-50%); }
.ring-2 { width: 800rpx; height: 800rpx; top: -300rpx; left: 50%; transform: translateX(-50%); }

.emoji-wrap {
  position: relative;
  width: 160rpx; height: 160rpx; margin: 0 auto 32rpx;
  display: flex; align-items: center; justify-content: center;
}
.emoji-bg {
  position: absolute; inset: 0; border-radius: 50%;
  background: linear-gradient(135deg, #F5F3FF, #FDF2F8);
}
.emoji {
  position: relative; font-size: 80rpx; z-index: 2;
}

.title {
  font-size: 36rpx; font-weight: 700; color: #1F2937; margin-bottom: 12rpx;
}
.hint {
  color: #6B7280; font-size: 26rpx; line-height: 1.6;
  white-space: pre-line; margin-bottom: 40rpx;
}
.buttons { display: flex; flex-direction: column; gap: 20rpx; position: relative; z-index: 1; }
.btn {
  height: 96rpx; line-height: 96rpx; border-radius: 48rpx;
  font-size: 30rpx; font-weight: 600; border: none;
  display: flex; align-items: center; justify-content: center; gap: 12rpx;
}
.btn.primary {
  background: linear-gradient(135deg, #8B5CF6, #6D28D9);
  color: #fff;
  box-shadow: 0 12rpx 32rpx rgba(139, 92, 246, .4);
}
.btn.ghost {
  background: #F3F4F6; color: #1F2937;
}
.btn-emoji { font-size: 32rpx; }

.trust {
  margin-top: 28rpx;
  font-size: 22rpx; color: #9CA3AF;
  display: flex; align-items: center; justify-content: center; gap: 6rpx;
}
.trust-emoji { font-size: 24rpx; }
</style>
