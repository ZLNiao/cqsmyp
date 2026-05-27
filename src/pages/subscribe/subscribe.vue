<template>
  <view class="subscribe">
    <view class="close" @click="onClose">×</view>

    <view class="title">✨ 解锁完整分析报告</view>
    <view class="subtitle">你只看到了部分内容\n订阅后解锁全部功能</view>

    <view class="benefits">
      <view v-for="(b, i) in benefits" :key="i" class="benefit">
        <text class="check">✅</text>
        <text>{{ b }}</text>
      </view>
    </view>

    <view class="plans">
      <view
        v-for="(p, i) in plans"
        :key="i"
        class="plan"
        :class="{ active: planIdx === i, hot: p.hot }"
        @click="planIdx = i"
      >
        <view v-if="p.hot" class="badge">🔥 限时优惠</view>
        <view class="price-row">
          <text class="price">{{ p.price }}</text>
          <text class="period">/{{ p.period }}</text>
        </view>
        <view v-if="p.original" class="original">原价 {{ p.original }}</view>
        <view class="hint">{{ p.hint }}</view>
      </view>
    </view>

    <button class="btn" @click="onSubscribe">📱 立即订阅</button>
    <view class="trial">7 天免费试用 ↗</view>
    <view class="tip">自动续费，随时取消</view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { createOrder } from '@/api/user'

const benefits = [
  '完整面部特征分析',
  'AI 妆容匹配',
  '色彩季型分析',
  '历史记录保存',
  '去广告'
]

const plans = [
  { price: '¥29.90', period: '月', original: '¥39.90', hint: '首月特惠', hot: true },
  { price: '¥69.90', period: '季', hint: '省 33%' },
  { price: '¥199.00', period: '年', hint: '省 58%' }
]
const planIdx = ref(0)

const onClose = () => uni.navigateBack()

const onSubscribe = async () => {
  const plan = plans[planIdx.value]
  uni.showLoading({ title: '调起支付...' })
  try {
    await createOrder({ plan: plan.period, price: plan.price })
    uni.hideLoading()
    uni.showToast({ title: '订阅成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1200)
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '支付失败', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
.subscribe {
  min-height: 100vh;
  padding: 100rpx 40rpx 80rpx;
  background: linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 60%);
}
.close {
  position: absolute; top: 60rpx; right: 40rpx;
  width: 64rpx; height: 64rpx; line-height: 60rpx; text-align: center;
  font-size: 56rpx; color: #9CA3AF;
}
.title { font-size: 48rpx; font-weight: 700; text-align: center; color: #1F2937; }
.subtitle {
  font-size: 28rpx; color: #6B7280; text-align: center;
  margin-top: 24rpx; white-space: pre-line; line-height: 1.6;
}
.benefits {
  background: #fff; border-radius: 24rpx; padding: 32rpx 40rpx;
  margin: 48rpx 0; box-shadow: 0 4rpx 16rpx rgba(0,0,0,.04);
}
.benefit {
  display: flex; align-items: center; gap: 16rpx; padding: 16rpx 0;
  font-size: 28rpx; color: #1F2937;
}
.plans { display: flex; flex-direction: column; gap: 20rpx; margin-bottom: 48rpx; }
.plan {
  position: relative; padding: 32rpx; border-radius: 24rpx;
  background: #fff; border: 4rpx solid #E5E7EB;
  &.active { border-color: #8B5CF6; box-shadow: 0 8rpx 24rpx rgba(139,92,246,.15); }
}
.badge {
  position: absolute; top: -16rpx; right: 32rpx;
  background: linear-gradient(135deg, #F59E0B, #EF4444);
  color: #fff; font-size: 22rpx; padding: 6rpx 20rpx; border-radius: 20rpx;
}
.price-row { display: flex; align-items: baseline; gap: 8rpx; }
.price { font-size: 48rpx; font-weight: 700; color: #1F2937; }
.period { font-size: 28rpx; color: #6B7280; }
.original { font-size: 24rpx; color: #9CA3AF; text-decoration: line-through; margin-top: 4rpx; }
.hint { font-size: 26rpx; color: #8B5CF6; margin-top: 8rpx; }
.btn {
  height: 96rpx; line-height: 96rpx;
  background: linear-gradient(135deg, #8B5CF6, #6D28D9);
  color: #fff; border-radius: 48rpx; font-size: 32rpx; font-weight: 600; border: none;
}
.trial { text-align: center; color: #8B5CF6; font-size: 26rpx; margin-top: 24rpx; }
.tip { text-align: center; color: #9CA3AF; font-size: 22rpx; margin-top: 12rpx; }
</style>
