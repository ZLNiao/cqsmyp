<template>
  <view class="info">
    <!-- 步骤进度 -->
    <view class="steps">
      <view class="step done">
        <view class="step-dot">✓</view>
        <view class="step-label">上传照片</view>
      </view>
      <view class="step-line done" />
      <view class="step active">
        <view class="step-dot">2</view>
        <view class="step-label">补充信息</view>
      </view>
      <view class="step-line" />
      <view class="step">
        <view class="step-dot">3</view>
        <view class="step-label">查看报告</view>
      </view>
    </view>

    <!-- 照片预览 -->
    <view class="preview">
      <image v-if="photo" class="preview-img" :src="photo" mode="aspectFill" />
      <view v-else class="preview-placeholder">无照片</view>
      <view class="preview-mask">
        <text>📸</text>
        <text class="preview-text">已上传</text>
      </view>
    </view>

    <view class="title">为了更精准的分析\n请补充一些信息</view>
    <view class="subtitle">所有信息仅用于本次分析，不会保存</view>

    <!-- 性别 -->
    <view class="block">
      <view class="label">性别</view>
      <view class="radios">
        <view
          v-for="(g, i) in genders"
          :key="i"
          class="radio"
          :class="{ active: genderIdx === i }"
          @click="genderIdx = i"
        >
          <text class="radio-emoji">{{ g.emoji }}</text>
          <text>{{ g.label }}</text>
        </view>
      </view>
    </view>

    <!-- 年龄 -->
    <view class="block">
      <view class="label">年龄段</view>
      <view class="chips">
        <view
          v-for="(a, i) in ageOptions"
          :key="i"
          class="chip"
          :class="{ active: ageIdx === i }"
          @click="ageIdx = i"
        >{{ a }}</view>
      </view>
    </view>

    <!-- 护肤需求 -->
    <view class="block">
      <view class="label">护肤需求 <text class="hint">（可多选）</text></view>
      <view class="chips">
        <view
          v-for="(t, i) in skinNeeds"
          :key="i"
          class="chip"
          :class="{ active: t.checked }"
          @click="t.checked = !t.checked"
        >
          <text class="chip-emoji">{{ t.emoji }}</text>
          <text>{{ t.label }}</text>
        </view>
      </view>
    </view>

    <!-- 化妆频率 -->
    <view class="block">
      <view class="label">化妆频率</view>
      <view class="radios">
        <view
          v-for="(f, i) in freqs"
          :key="i"
          class="radio small"
          :class="{ active: freqIdx === i }"
          @click="freqIdx = i"
        >{{ f }}</view>
      </view>
    </view>

    <button class="btn" @click="onSubmit">
      <text>开始分析</text>
      <text class="btn-arrow">🚀</text>
    </button>
    <view class="skip" @click="onSkip">跳过，直接分析</view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

const photo = ref('')
const genders = [
  { label: '女', emoji: '👩' },
  { label: '男', emoji: '👨' },
  { label: '保密', emoji: '🤫' }
]
const genderIdx = ref(0)

const ageOptions = ['18 以下', '18-24', '25-34', '35-44', '45+']
const ageIdx = ref(1)

const skinNeeds = reactive([
  { label: '美白提亮', emoji: '✨', checked: false },
  { label: '控油祛痘', emoji: '🧴', checked: false },
  { label: '抗衰老', emoji: '⏳', checked: false },
  { label: '敏感修复', emoji: '🌿', checked: false },
  { label: '补水保湿', emoji: '💧', checked: false }
])

const freqs = ['每天', '偶尔', '从不']
const freqIdx = ref(1)

onMounted(() => {
  photo.value = uni.getStorageSync('pendingPhoto') || ''
})

const startAnalyze = async () => {
  uni.setStorageSync('userInfo', {
    gender: genders[genderIdx.value].label,
    age: ageOptions[ageIdx.value],
    skinNeeds: skinNeeds.filter((t) => t.checked).map((t) => t.label),
    makeupFreq: freqs[freqIdx.value]
  })
  // 跳转到带动画的加载页（loading 页内部会调用分析接口并跳到结果页）
  uni.redirectTo({ url: '/pages/loading/loading' })
}

const onSubmit = () => {
  if (!photo.value) {
    uni.showToast({ title: '请先选择照片', icon: 'none' })
    return
  }
  startAnalyze()
}
const onSkip = () => onSubmit()
</script>

<style lang="scss" scoped>
.info { padding: 32rpx 32rpx 80rpx; }

/* 步骤条 */
.steps { display: flex; align-items: center; padding: 8rpx 0 32rpx; }
.step { display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
.step-dot {
  width: 56rpx; height: 56rpx; border-radius: 50%;
  background: #E5E7EB; color: #9CA3AF;
  display: flex; align-items: center; justify-content: center;
  font-size: 24rpx; font-weight: 700;
}
.step.done .step-dot { background: #10B981; color: #fff; }
.step.active .step-dot {
  background: linear-gradient(135deg, #8B5CF6, #6D28D9); color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(139, 92, 246, .4);
}
.step-label { font-size: 22rpx; color: #6B7280; }
.step.active .step-label { color: #8B5CF6; font-weight: 600; }
.step-line {
  flex: 1; height: 4rpx; background: #E5E7EB; margin: 0 16rpx; margin-bottom: 28rpx;
  &.done { background: #10B981; }
}

/* 照片预览 */
.preview {
  position: relative;
  width: 200rpx; height: 200rpx; margin: 0 auto 32rpx;
  border-radius: 28rpx; overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, .1);
}
.preview-img { width: 100%; height: 100%; }
.preview-placeholder {
  width: 100%; height: 100%; background: #F3F4F6;
  display: flex; align-items: center; justify-content: center;
  font-size: 24rpx; color: #9CA3AF;
}
.preview-mask {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: linear-gradient(180deg, transparent, rgba(0,0,0,.6));
  padding: 20rpx 12rpx 12rpx;
  display: flex; flex-direction: column; align-items: center; gap: 4rpx;
  color: #fff; font-size: 28rpx;
}
.preview-text { font-size: 20rpx; }

.title {
  font-size: 40rpx; font-weight: 700; color: #1F2937;
  white-space: pre-line; line-height: 1.5; text-align: center; margin-bottom: 12rpx;
}
.subtitle { text-align: center; font-size: 24rpx; color: #9CA3AF; margin-bottom: 48rpx; }

.block { margin-bottom: 40rpx; }
.label {
  font-size: 28rpx; color: #1F2937; font-weight: 600; margin-bottom: 20rpx;
  .hint { font-weight: 400; color: #9CA3AF; font-size: 24rpx; }
}

/* chips（标签） */
.chips { display: flex; flex-wrap: wrap; gap: 16rpx; }
.chip {
  display: flex; align-items: center; gap: 8rpx;
  padding: 16rpx 28rpx; background: #fff; border-radius: 32rpx;
  font-size: 26rpx; color: #6B7280;
  border: 2rpx solid transparent;
  transition: all .2s;
  &.active {
    background: linear-gradient(135deg, #F5F3FF, #FDF2F8);
    border-color: #8B5CF6;
    color: #8B5CF6;
    font-weight: 600;
  }
}
.chip-emoji { font-size: 28rpx; }

/* radios */
.radios { display: flex; gap: 16rpx; }
.radio {
  flex: 1; padding: 24rpx 0; text-align: center;
  background: #fff; border-radius: 16rpx; font-size: 28rpx; color: #6B7280;
  border: 2rpx solid transparent;
  display: flex; flex-direction: column; align-items: center; gap: 8rpx;
  &.small { padding: 20rpx 0; }
  &.active {
    background: linear-gradient(135deg, #8B5CF6, #6D28D9); color: #fff;
    box-shadow: 0 8rpx 20rpx rgba(139, 92, 246, .3);
  }
}
.radio-emoji { font-size: 36rpx; }

.btn {
  margin-top: 60rpx;
  height: 96rpx; line-height: 96rpx;
  background: linear-gradient(135deg, #8B5CF6, #6D28D9);
  color: #fff; border-radius: 48rpx; font-size: 32rpx; font-weight: 600; border: none;
  display: flex; align-items: center; justify-content: center; gap: 12rpx;
  box-shadow: 0 16rpx 40rpx rgba(139, 92, 246, .4);
}
.btn-arrow { font-size: 28rpx; }
.skip { text-align: center; color: #9CA3AF; font-size: 26rpx; padding: 24rpx; }
</style>
