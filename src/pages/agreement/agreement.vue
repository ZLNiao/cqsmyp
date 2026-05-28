<template>
  <view class="agreement">
    <view class="hero" :style="{ paddingTop: (statusBarHeight + 32) + 'px' }">
      <view class="back" @click="onBack">‹</view>
      <view class="title">{{ doc.title }}</view>
      <view class="updated">最近更新：{{ doc.lastUpdated }}</view>
    </view>

    <view class="content">
      <view v-for="(sec, i) in doc.sections" :key="i" class="section">
        <view class="section-title">{{ sec.title }}</view>
        <view class="section-content">{{ sec.content }}</view>
      </view>

      <view class="footer">
        <text>感谢您的阅读，如有疑问请联系客服</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { AGREEMENTS } from '@/utils/agreements'

const statusBarHeight = ref(20)
const type = ref('user')

const doc = computed(() => AGREEMENTS[type.value] || AGREEMENTS.user)

onLoad((options) => {
  if (options?.type && AGREEMENTS[options.type]) {
    type.value = options.type
  }
  // 动态设置导航栏标题
  uni.setNavigationBarTitle({ title: doc.value.title })
})

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20
})

const onBack = () => uni.navigateBack()
</script>

<style lang="scss" scoped>
.agreement {
  min-height: 100vh;
  background: #F8F9FA;
  padding-bottom: 60rpx;
}

/* Hero */
.hero {
  position: relative;
  background: linear-gradient(180deg, #FAF5FF 0%, #FDF2F8 60%, #F8F9FA 100%);
  padding: 32rpx 32rpx 48rpx;
  border-radius: 0 0 40rpx 40rpx;
  text-align: center;
}
.back {
  position: absolute;
  top: 60rpx; left: 20rpx;
  width: 64rpx; height: 64rpx; line-height: 56rpx;
  font-size: 56rpx; color: #6B7280; text-align: center;
}
.title {
  font-size: 44rpx; font-weight: 700; color: #1F2937;
  letter-spacing: 2rpx;
}
.updated {
  font-size: 24rpx; color: #9CA3AF;
  margin-top: 12rpx;
}

/* Content */
.content {
  margin: 24rpx 32rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 8rpx 32rpx 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, .04);
}
.section {
  padding: 28rpx 0;
  border-bottom: 1rpx solid #F3F4F6;
}
.section:last-child {
  border-bottom: none;
}
.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 16rpx;
  padding-left: 16rpx;
  border-left: 6rpx solid #8B5CF6;
}
.section-content {
  font-size: 26rpx;
  color: #4B5563;
  line-height: 1.8;
  white-space: pre-line;
  word-break: break-word;
}

.footer {
  margin-top: 32rpx;
  text-align: center;
  font-size: 22rpx;
  color: #9CA3AF;
  padding: 24rpx;
}
</style>
