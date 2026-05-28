<template>
  <view class="result">
    <!-- 头部 hero -->
    <view class="hero">
      <view class="photo-wrap">
        <image v-if="photo" class="photo" :src="photo" mode="aspectFill" />
        <view v-else class="photo-placeholder">📸</view>
        <view class="photo-glow" />
      </view>
      <view class="user-tag">
        <text class="tag-emoji">✨</text>
        <text>你的专属美颜报告</text>
      </view>
      <view class="hero-title">{{ data.faceShape.label }} · {{ data.skinTone.label }}</view>
      <view class="hero-sub">分析完成于 {{ analyzeTime }}</view>
    </view>

    <!-- 总评分卡片 -->
    <view class="score-card delay-0">
      <view class="score-row">
        <view class="score-item" v-for="(s, i) in scores" :key="i">
          <view class="score-num">{{ s.value }}<text class="score-unit">{{ s.unit }}</text></view>
          <view class="score-label">{{ s.label }}</view>
        </view>
      </view>
    </view>

    <!-- 脸型 -->
    <analysis-card title="你的脸型" emoji="🟣">
      <view class="face-shape">
        <view class="face-shape-illu" :style="{ background: faceShapeBg }">
          <text class="face-shape-emoji">{{ faceShapeEmoji }}</text>
        </view>
        <view class="face-shape-info">
          <view class="big">{{ data.faceShape.label }}</view>
          <view class="muted"><text class="dot">·</text>特征：{{ data.faceShape.feature }}</view>
          <view class="muted"><text class="dot">·</text>适合：{{ data.faceShape.suit }}</view>
        </view>
      </view>
    </analysis-card>

    <!-- 肤色 + 色盘 -->
    <analysis-card title="肤色与色彩季型" emoji="🎨">
      <view class="big">{{ data.skinTone.label }}</view>
      <view v-if="data.skinTone.desc" class="muted">
        <text class="dot">·</text>{{ data.skinTone.desc }}
      </view>
      <view v-if="data.skinTone.skinDescription" class="muted">
        <text class="dot">·</text>肤色：{{ data.skinTone.skinDescription }}
      </view>
      <view class="palette-label">推荐色系</view>
      <view class="palette">
        <view v-for="(c, i) in (data.skinTone.colors || colorPalette)" :key="i" class="color-chip">
          <view class="color-circle" :style="{ background: c.color }" />
          <text class="color-name">{{ c.name }}</text>
        </view>
      </view>
    </analysis-card>

    <!-- 五官特征 -->
    <analysis-card title="五官特征" emoji="✨">
      <view class="grid">
        <view class="grid-item" v-for="(f, i) in data.features" :key="i">
          <view class="grid-emoji-wrap">
            <text class="grid-emoji">{{ f.emoji }}</text>
          </view>
          <view>
            <view class="grid-label">{{ f.name }}</view>
            <view class="grid-value">{{ f.value }}</view>
          </view>
        </view>
      </view>
    </analysis-card>

    <!-- 明星相似度 -->
    <analysis-card title="明星相似度" emoji="⭐" :locked="!isVip">
      <view class="celebs">
        <view v-for="(c, i) in data.celebs" :key="i" class="celeb">
          <view class="celeb-avatar" :style="{ background: c.bg }">{{ c.emoji }}</view>
          <view class="celeb-name">{{ c.name }}</view>
          <view class="celeb-bar">
            <view class="celeb-fill" :style="{ width: c.sim + '%' }" />
          </view>
          <view class="celeb-sim">{{ c.sim }}%</view>
        </view>
      </view>
    </analysis-card>

    <!-- AI 妆容建议 -->
    <analysis-card title="AI 专属妆容建议" emoji="💄" :locked="!isVip">
      <view class="makeup-title">{{ data.makeup.title }}</view>
      <view class="makeup-steps">
        <view v-for="(step, i) in data.makeup.steps" :key="i" class="makeup-step">
          <view class="step-num">{{ i + 1 }}</view>
          <view class="step-text">{{ step }}</view>
        </view>
      </view>
    </analysis-card>

    <!-- AI 变美 CTA -->
    <view class="cta-card" @click="onTryAi">
      <view class="cta-bg" />
      <view class="cta-content">
        <view class="cta-icon">✨</view>
        <view class="cta-text">
          <view class="cta-title">看看 AI 变美后的我</view>
          <view class="cta-sub">一键生成专属妆容效果图</view>
        </view>
        <view class="cta-arrow">→</view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="actions">
      <view class="action" @click="onShare">
        <text class="action-emoji">📤</text>
        <text>分享</text>
      </view>
      <view class="action" @click="onSave">
        <text class="action-emoji">💾</text>
        <text>保存</text>
      </view>
      <view class="action primary" @click="goSubscribe">
        <text class="action-emoji">🔓</text>
        <text>解锁全部</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'

const user = useUserStore()
const isVip = computed(() => user.isVip)

const photo = ref('')
const analyzeTime = ref('')
const data = ref({
  faceShape: { label: '心形脸', feature: '额头宽、下巴尖', suit: '柔和眉形、浅色唇妆' },
  skinTone: { label: '暖调 · 春季型', tone: '暖白皮' },
  features: [
    { emoji: '👁️', name: '眼型', value: '杏眼' },
    { emoji: '✏️', name: '眉形', value: '标准眉' },
    { emoji: '💋', name: '唇形', value: 'M 形唇' },
    { emoji: '👃', name: '鼻型', value: '直鼻' }
  ],
  celebs: [
    { emoji: '👩', name: '刘亦菲', sim: 85, bg: 'linear-gradient(135deg, #FBCFE8, #F472B6)' },
    { emoji: '👩‍🦰', name: '迪丽热巴', sim: 72, bg: 'linear-gradient(135deg, #FDE68A, #F59E0B)' },
    { emoji: '👩‍🦱', name: '杨幂', sim: 65, bg: 'linear-gradient(135deg, #C4B5FD, #8B5CF6)' }
  ],
  makeup: {
    title: '日常通勤妆',
    steps: [
      '底妆：轻薄粉底 + 局部遮瑕',
      '眼妆：大地色眼影 + 自然眼线',
      '唇妆：豆沙色唇釉',
      '腮红：珊瑚色斜向扫'
    ]
  }
})

const scores = computed(() => [
  { label: '颜值评分', value: data.value.beauty ? Math.round(data.value.beauty) : 92, unit: '分' },
  { label: '上镜指数', value: getPhotoGrade(data.value.beauty), unit: '' },
  { label: '风格契合', value: data.value.faceShape?.probability ? Math.round(data.value.faceShape.probability * 100) : 95, unit: '%' }
])

function getPhotoGrade(beauty) {
  if (!beauty) return 'A+'
  if (beauty >= 80) return 'A+'
  if (beauty >= 70) return 'A'
  if (beauty >= 60) return 'B+'
  return 'B'
}

const colorPalette = [
  { name: '大地色', color: '#A78460' },
  { name: '珊瑚色', color: '#FF7F7F' },
  { name: '暖橘色', color: '#FF9966' },
  { name: '裸粉色', color: '#F4C2C2' },
  { name: '玫瑰金', color: '#B76E79' },
  { name: '香槟金', color: '#F7E7CE' }
]

const faceShapeBg = computed(() => {
  const map = {
    '心形脸': 'linear-gradient(135deg, #FBCFE8, #F472B6)',
    '鹅蛋脸': 'linear-gradient(135deg, #DDD6FE, #8B5CF6)',
    '圆脸': 'linear-gradient(135deg, #FED7AA, #FB923C)',
    '方脸': 'linear-gradient(135deg, #BFDBFE, #3B82F6)',
    '长脸': 'linear-gradient(135deg, #FDE68A, #F59E0B)'
  }
  return map[data.value.faceShape.label] || map['心形脸']
})

const faceShapeEmoji = computed(() => {
  const map = { '心形脸': '💗', '鹅蛋脸': '🥚', '圆脸': '⭕', '方脸': '⬜', '长脸': '📏' }
  return map[data.value.faceShape.label] || '💗'
})

onMounted(() => {
  photo.value = uni.getStorageSync('pendingPhoto') || ''
  const cached = uni.getStorageSync('lastAnalysis')
  if (cached) data.value = { ...data.value, ...cached }
  const d = new Date()
  analyzeTime.value = `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

const onTryAi = () => {
  if (!isVip.value) { goSubscribe(); return }
  uni.navigateTo({ url: '/pages/ai-makeup/ai-makeup' })
}
const onShare = () => uni.showToast({ title: '调起分享', icon: 'none' })
const onSave = () => uni.showToast({ title: '已保存到相册', icon: 'success' })
const goSubscribe = () => uni.navigateTo({ url: '/pages/subscribe/subscribe' })
</script>

<style lang="scss" scoped>
.result { padding-bottom: 200rpx; background: #F8F9FA; min-height: 100vh; }

/* Hero 头部 */
.hero {
  background: linear-gradient(180deg, #FAF5FF 0%, #FDF2F8 60%, #F8F9FA 100%);
  padding: 40rpx 32rpx 48rpx;
  text-align: center;
  border-radius: 0 0 40rpx 40rpx;
}
.photo-wrap {
  position: relative;
  width: 240rpx; height: 240rpx; margin: 0 auto 24rpx;
  border-radius: 50%; overflow: visible;
}
.photo, .photo-placeholder {
  width: 100%; height: 100%; border-radius: 50%; overflow: hidden;
  background: #fff; box-shadow: 0 12rpx 40rpx rgba(139, 92, 246, .25);
  position: relative; z-index: 2;
}
.photo-placeholder {
  display: flex; align-items: center; justify-content: center;
  font-size: 80rpx; background: #F3F4F6;
}
.photo-glow {
  position: absolute; inset: -20rpx; border-radius: 50%;
  background: linear-gradient(135deg, #8B5CF6, #EC4899);
  filter: blur(40rpx); opacity: .4; z-index: 1;
}
.user-tag {
  display: inline-flex; align-items: center; gap: 8rpx;
  padding: 8rpx 24rpx; border-radius: 32rpx;
  background: rgba(139, 92, 246, .12); color: #8B5CF6;
  font-size: 24rpx; font-weight: 600; margin-bottom: 16rpx;
}
.hero-title {
  font-size: 44rpx; font-weight: 700; color: #1F2937; letter-spacing: 1rpx;
}
.hero-sub { font-size: 24rpx; color: #9CA3AF; margin-top: 12rpx; }

/* 评分卡 */
.score-card {
  margin: -32rpx 24rpx 24rpx;
  background: #fff; border-radius: 24rpx;
  padding: 32rpx 0;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, .06);
  position: relative; z-index: 5;
}
.score-row { display: flex; }
.score-item {
  flex: 1; text-align: center; position: relative;
  &:not(:last-child)::after {
    content: ''; position: absolute; right: 0; top: 20%; height: 60%;
    width: 2rpx; background: #F3F4F6;
  }
}
.score-num {
  font-size: 48rpx; font-weight: 800;
  background: linear-gradient(135deg, #8B5CF6, #EC4899);
  -webkit-background-clip: text; color: transparent;
}
.score-unit { font-size: 24rpx; color: #6B7280; margin-left: 4rpx; }
.score-label { font-size: 24rpx; color: #6B7280; margin-top: 4rpx; }

/* 通用 */
.big { font-size: 40rpx; font-weight: 700; color: #1F2937; margin: 8rpx 0 16rpx; }
.muted { font-size: 26rpx; color: #6B7280; margin: 6rpx 0; line-height: 1.6; }
.dot { color: #8B5CF6; margin-right: 8rpx; }

/* 脸型卡片 */
.face-shape { display: flex; align-items: center; gap: 24rpx; }
.face-shape-illu {
  width: 140rpx; height: 140rpx; border-radius: 32rpx;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, .08);
}
.face-shape-emoji { font-size: 64rpx; }
.face-shape-info { flex: 1; }

/* 色盘 */
.palette-label { font-size: 24rpx; color: #6B7280; margin: 20rpx 0 16rpx; }
.palette { display: flex; flex-wrap: wrap; gap: 16rpx; }
.color-chip {
  display: flex; align-items: center; gap: 12rpx;
  padding: 8rpx 20rpx 8rpx 8rpx;
  background: #F9FAFB; border-radius: 32rpx;
}
.color-circle {
  width: 40rpx; height: 40rpx; border-radius: 50%;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 3rpx rgba(255, 255, 255, .4),
              0 2rpx 8rpx rgba(0, 0, 0, .12);
}
.color-name { font-size: 24rpx; color: #1F2937; }

/* 五官 grid */
.grid { display: flex; flex-wrap: wrap; }
.grid-item {
  width: 50%; padding: 16rpx 0;
  display: flex; align-items: center; gap: 16rpx;
}
.grid-emoji-wrap {
  width: 72rpx; height: 72rpx; border-radius: 20rpx;
  background: linear-gradient(135deg, #F5F3FF, #FDF2F8);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.grid-emoji { font-size: 36rpx; }
.grid-label { font-size: 22rpx; color: #9CA3AF; }
.grid-value { font-size: 30rpx; color: #1F2937; font-weight: 600; margin-top: 2rpx; }

/* 明星相似度 */
.celebs { display: flex; flex-direction: column; gap: 24rpx; }
.celeb {
  display: grid; grid-template-columns: 80rpx 120rpx 1fr 80rpx;
  gap: 16rpx; align-items: center;
}
.celeb-avatar {
  width: 80rpx; height: 80rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 40rpx;
}
.celeb-name { font-size: 26rpx; color: #1F2937; font-weight: 600; }
.celeb-bar {
  height: 16rpx; background: #F3F4F6; border-radius: 8rpx; overflow: hidden;
}
.celeb-fill {
  height: 100%; background: linear-gradient(90deg, #8B5CF6, #EC4899);
  border-radius: 8rpx;
  animation: fill 1s ease-out;
}
.celeb-sim {
  font-size: 26rpx; font-weight: 700; text-align: right;
  background: linear-gradient(135deg, #8B5CF6, #EC4899);
  -webkit-background-clip: text; color: transparent;
}

/* 妆容建议 */
.makeup-title { font-size: 32rpx; font-weight: 700; color: #1F2937; margin-bottom: 20rpx; }
.makeup-steps { display: flex; flex-direction: column; gap: 16rpx; }
.makeup-step {
  display: flex; align-items: flex-start; gap: 16rpx;
  padding: 20rpx 24rpx;
  background: linear-gradient(135deg, #FAF5FF, #FDF2F8);
  border-radius: 16rpx;
}
.step-num {
  flex-shrink: 0;
  width: 40rpx; height: 40rpx; border-radius: 50%;
  background: linear-gradient(135deg, #8B5CF6, #6D28D9); color: #fff;
  font-size: 22rpx; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.step-text { font-size: 26rpx; color: #1F2937; line-height: 1.6; }

/* CTA */
.cta-card {
  position: relative;
  margin: 32rpx 24rpx; padding: 32rpx; border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 16rpx 40rpx rgba(139, 92, 246, .3);
}
.cta-bg {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, #8B5CF6, #EC4899);
}
.cta-content {
  position: relative; z-index: 2;
  display: flex; align-items: center; gap: 20rpx;
}
.cta-icon {
  font-size: 60rpx;
  width: 96rpx; height: 96rpx; border-radius: 24rpx;
  background: rgba(255,255,255,.2);
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(10rpx);
}
.cta-text { flex: 1; color: #fff; }
.cta-title { font-size: 32rpx; font-weight: 700; }
.cta-sub { font-size: 24rpx; opacity: .9; margin-top: 4rpx; }
.cta-arrow { color: #fff; font-size: 40rpx; }

/* 底部操作栏 */
.actions {
  position: fixed; left: 0; right: 0; bottom: 0;
  background: #fff; padding: 16rpx 24rpx; padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  display: flex; gap: 16rpx; box-shadow: 0 -4rpx 20rpx rgba(0,0,0,.06);
}
.action {
  flex: 1; height: 88rpx; border-radius: 16rpx;
  background: #F3F4F6; font-size: 26rpx; color: #1F2937;
  display: flex; align-items: center; justify-content: center; gap: 8rpx;
  &.primary {
    flex: 1.5;
    background: linear-gradient(135deg, #8B5CF6, #6D28D9); color: #fff; font-weight: 600;
  }
}
.action-emoji { font-size: 30rpx; }

@keyframes fill {
  from { width: 0; }
}
</style>
