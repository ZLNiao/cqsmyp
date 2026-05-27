<template>
  <view class="info">
    <view class="title">为了更精准的分析\n请补充一些信息</view>

    <view class="block">
      <view class="label">年龄</view>
      <picker :range="ageOptions" :value="ageIdx" @change="(e) => ageIdx = +e.detail.value">
        <view class="picker">{{ ageOptions[ageIdx] }}</view>
      </picker>
    </view>

    <view class="block">
      <view class="label">护肤需求（可多选）</view>
      <view class="tags">
        <view
          v-for="(t, i) in skinNeeds"
          :key="i"
          class="tag"
          :class="{ active: t.checked }"
          @click="t.checked = !t.checked"
        >{{ t.label }}</view>
      </view>
    </view>

    <view class="block">
      <view class="label">化妆频率</view>
      <view class="radios">
        <view
          v-for="(f, i) in freqs"
          :key="i"
          class="radio"
          :class="{ active: freqIdx === i }"
          @click="freqIdx = i"
        >{{ f }}</view>
      </view>
    </view>

    <button class="btn" @click="onSubmit">开始分析 🚀</button>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { analyzeFace } from '@/api/analysis'

const ageOptions = ['18 以下', '18-24', '25-34', '35-44', '45+']
const ageIdx = ref(1)
const skinNeeds = reactive([
  { label: '美白提亮', checked: false },
  { label: '控油祛痘', checked: false },
  { label: '抗衰老', checked: false },
  { label: '敏感修复', checked: false },
  { label: '补水保湿', checked: false }
])
const freqs = ['每天', '偶尔', '从不']
const freqIdx = ref(1)

const onSubmit = async () => {
  const photo = uni.getStorageSync('pendingPhoto')
  if (!photo) {
    uni.showToast({ title: '请先选择照片', icon: 'none' })
    return
  }

  uni.setStorageSync('userInfo', {
    age: ageOptions[ageIdx.value],
    skinNeeds: skinNeeds.filter((t) => t.checked).map((t) => t.label),
    makeupFreq: freqs[freqIdx.value]
  })

  uni.showLoading({ title: '分析中...', mask: true })
  try {
    const result = await analyzeFace(photo)
    uni.setStorageSync('lastAnalysis', result)
    uni.hideLoading()
    uni.redirectTo({ url: '/pages/result/result' })
  } catch (e) {
    uni.hideLoading()
    uni.showToast({ title: '分析失败，请重试', icon: 'none' })
  }
}
</script>

<style lang="scss" scoped>
.info { padding: 40rpx 32rpx 80rpx; }
.title {
  font-size: 40rpx; font-weight: 700; color: #1F2937;
  white-space: pre-line; line-height: 1.5; margin-bottom: 48rpx;
}
.block { margin-bottom: 48rpx; }
.label { font-size: 28rpx; color: #6B7280; margin-bottom: 20rpx; }
.picker {
  height: 88rpx; line-height: 88rpx; padding: 0 28rpx;
  background: #fff; border-radius: 16rpx; font-size: 30rpx;
}
.tags { display: flex; flex-wrap: wrap; gap: 16rpx; }
.tag {
  padding: 16rpx 28rpx; background: #fff; border-radius: 32rpx;
  font-size: 26rpx; color: #6B7280;
  &.active { background: #8B5CF6; color: #fff; }
}
.radios { display: flex; gap: 16rpx; }
.radio {
  flex: 1; height: 80rpx; line-height: 80rpx; text-align: center;
  background: #fff; border-radius: 16rpx; font-size: 28rpx; color: #6B7280;
  &.active { background: linear-gradient(135deg, #8B5CF6, #6D28D9); color: #fff; }
}
.btn {
  margin-top: 60rpx;
  height: 96rpx; line-height: 96rpx;
  background: linear-gradient(135deg, #8B5CF6, #6D28D9);
  color: #fff; border-radius: 48rpx; font-size: 32rpx; font-weight: 600; border: none;
}
</style>
