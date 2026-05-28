<template>
  <view class="subscribe">
    <!-- 装饰光斑 -->
    <view class="bg-blob bg-1" />
    <view class="bg-blob bg-2" />

    <view class="close" @click="onClose">×</view>

    <!-- Hero -->
    <view class="hero" :style="{ paddingTop: (statusBarHeight + 60) + 'px' }">
      <view class="crown">👑</view>
      <view class="title">解锁 GlamUp 完整版</view>
      <view class="subtitle">让 AI 为你定制专属的美颜方案</view>

      <!-- 限时倒计时 -->
      <view class="countdown">
        <text class="cd-label">🔥 限时优惠仅剩</text>
        <view class="cd-time">
          <text class="cd-num">{{ countdown.h }}</text>
          <text class="cd-colon">:</text>
          <text class="cd-num">{{ countdown.m }}</text>
          <text class="cd-colon">:</text>
          <text class="cd-num">{{ countdown.s }}</text>
        </view>
      </view>
    </view>

    <!-- 对比表 -->
    <view class="compare-card">
      <view class="compare-head">
        <text class="compare-feature">功能对比</text>
        <text class="compare-col">免费</text>
        <text class="compare-col vip">VIP</text>
      </view>
      <view v-for="(c, i) in compareList" :key="i" class="compare-row">
        <text class="compare-feature">{{ c.label }}</text>
        <text class="compare-col">{{ c.free ? '✓' : '—' }}</text>
        <text class="compare-col vip">✓</text>
      </view>
    </view>

    <!-- 套餐选择 -->
    <view class="plans">
      <view
        v-for="(p, i) in plans"
        :key="i"
        class="plan"
        :class="{ active: planIdx === i, hot: p.hot }"
        @click="planIdx = i"
      >
        <view v-if="p.hot" class="badge">🔥 最划算</view>
        <view class="plan-period">{{ p.period }}</view>
        <view class="price-row">
          <text class="currency">¥</text>
          <text class="price">{{ p.price }}</text>
        </view>
        <view v-if="p.original" class="original">原价 ¥{{ p.original }}</view>
        <view class="hint">{{ p.hint }}</view>
        <view v-if="planIdx === i" class="check-mark">✓</view>
      </view>
    </view>

    <!-- 用户评价 -->
    <view class="reviews">
      <view class="reviews-title">⭐⭐⭐⭐⭐ 真实用户评价</view>
      <scroll-view class="reviews-scroll" scroll-x>
        <view v-for="(r, i) in reviews" :key="i" class="review">
          <view class="review-head">
            <view class="review-avatar" :style="{ background: r.bg }">{{ r.emoji }}</view>
            <view>
              <view class="review-name">{{ r.name }}</view>
              <view class="review-stars">⭐⭐⭐⭐⭐</view>
            </view>
          </view>
          <view class="review-content">{{ r.content }}</view>
        </view>
      </scroll-view>
    </view>

    <!-- 福利说明 -->
    <view class="benefits">
      <view v-for="(b, i) in benefits" :key="i" class="benefit">
        <text class="benefit-emoji">{{ b.emoji }}</text>
        <view>
          <view class="benefit-title">{{ b.title }}</view>
          <view class="benefit-sub">{{ b.sub }}</view>
        </view>
      </view>
    </view>

    <!-- 底部固定按钮 -->
    <view class="bottom-bar">
      <view class="bottom-info">
        <text class="bottom-price">¥{{ plans[planIdx].price }}</text>
        <text class="bottom-period">/{{ plans[planIdx].period }}</text>
        <text class="bottom-tip">7 天免费试用</text>
      </view>
      <button class="bottom-btn" @click="onSubscribe">立即开通</button>
    </view>

    <view class="agreement">
      点击订阅即代表同意《会员服务协议》<br>
      自动续费，可在「我的」中随时取消
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { createOrder, getOrderStatus } from '@/api/user'
import { useUserStore } from '@/store/user'

const user = useUserStore()
const statusBarHeight = ref(20)

const PLAN_KEY_MAP = { '月': 'month', '季': 'quarter', '年': 'year' }

const compareList = [
  { label: '基础脸型分析', free: true },
  { label: '基础肤色分析', free: true },
  { label: '完整五官特征', free: false },
  { label: '色彩季型分析', free: false },
  { label: '明星相似度对比', free: false },
  { label: 'AI 妆容推荐', free: false },
  { label: 'AI 换妆生成', free: false },
  { label: '历史记录保存', free: false },
  { label: '去除广告', free: false }
]

const plans = [
  { period: '月', price: '29.90', original: '39.90', hint: '首月特惠' },
  { period: '季', price: '69.90', original: '119.70', hint: '省 33%', hot: true },
  { period: '年', price: '199.00', original: '478.80', hint: '省 58%' }
]
const planIdx = ref(1)

const reviews = [
  { name: '小雅 *', emoji: '👩', bg: 'linear-gradient(135deg, #FBCFE8, #F472B6)', content: '色彩季型分析太准了！按推荐买的口红朋友都说好看 💄' },
  { name: 'Lily *', emoji: '👩‍🦰', bg: 'linear-gradient(135deg, #FDE68A, #F59E0B)', content: 'AI 妆容方案对手残党太友好，照着画一次就会了！' },
  { name: '糖糖 *', emoji: '👩‍🦱', bg: 'linear-gradient(135deg, #C4B5FD, #8B5CF6)', content: '从来不知道自己适合什么颜色，现在终于会买衣服了😭' }
]

const benefits = [
  { emoji: '🛡️', title: '数据安全保障', sub: '照片仅本地处理，不会上传' },
  { emoji: '⏰', title: '7 天免费试用', sub: '随时取消，零风险体验' },
  { emoji: '🔄', title: '支持随时退款', sub: '7 天内不满意全额退款' }
]

const countdown = reactive({ h: '23', m: '59', s: '59' })
let timer = null

onMounted(() => {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 20

  // 倒计时（演示用：从 23:59:59 倒数）
  let total = 23 * 3600 + 59 * 60 + 59
  timer = setInterval(() => {
    if (total <= 0) { total = 23 * 3600 + 59 * 60 + 59 }
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    countdown.h = String(h).padStart(2, '0')
    countdown.m = String(m).padStart(2, '0')
    countdown.s = String(s).padStart(2, '0')
    total -= 1
  }, 1000)
})

onUnmounted(() => { if (timer) clearInterval(timer) })

const onClose = () => uni.navigateBack()

const onSubscribe = async () => {
  // 1. 检查登录
  if (!user.isLogin) {
    uni.showModal({
      title: '需要登录',
      content: '订阅前请先登录账号',
      confirmText: '去登录',
      success: ({ confirm }) => {
        if (confirm) uni.navigateTo({ url: '/pages/login/login' })
      }
    })
    return
  }

  const plan = plans[planIdx.value]
  const planKey = PLAN_KEY_MAP[plan.period]

  uni.showLoading({ title: '正在创建订单...', mask: true })
  try {
    const { orderId, payArgs, mock } = await createOrder({ plan: planKey })

    // 2. 后端未配微信支付时的 mock 流程（开发环境）
    if (mock) {
      uni.hideLoading()
      uni.showToast({ title: '订阅成功（开发模式）', icon: 'success' })
      await user.fetchProfile()
      setTimeout(() => uni.navigateBack(), 1200)
      return
    }

    // 3. 调起微信支付
    uni.hideLoading()
    uni.requestPayment({
      provider: 'wxpay',
      orderInfo: payArgs, // App 端：用 orderInfo
      ...payArgs,         // H5/小程序端：直接展开
      success: async () => {
        uni.showLoading({ title: '确认中...', mask: true })
        // 4. 轮询订单状态（最多 10 秒）
        for (let i = 0; i < 10; i++) {
          try {
            const order = await getOrderStatus(orderId)
            if (order.status === 'paid') {
              await user.fetchProfile()
              uni.hideLoading()
              uni.showToast({ title: '订阅成功 ✨', icon: 'success' })
              setTimeout(() => uni.navigateBack(), 1500)
              return
            }
          } catch {}
          await new Promise((r) => setTimeout(r, 1000))
        }
        // 超时也认为成功（微信回调可能稍后到达）
        uni.hideLoading()
        uni.showToast({ title: '支付完成，会员稍后生效', icon: 'none' })
        setTimeout(() => uni.navigateBack(), 1500)
      },
      fail: (err) => {
        uni.hideLoading()
        if (err.errMsg && !err.errMsg.includes('cancel')) {
          uni.showToast({ title: '支付失败', icon: 'none' })
        }
      }
    })
  } catch (e) {
    uni.hideLoading()
    // request.js 已弹错误 toast
  }
}
</script>

<style lang="scss" scoped>
.subscribe {
  position: relative; min-height: 100vh; padding-bottom: 240rpx;
  background: linear-gradient(180deg, #FAF5FF 0%, #FDF2F8 30%, #F8F9FA 60%);
  overflow: hidden;
}
.bg-blob {
  position: absolute; border-radius: 50%; filter: blur(80rpx); opacity: .5;
  pointer-events: none;
}
.bg-1 { width: 500rpx; height: 500rpx; background: #C4B5FD; top: -100rpx; right: -100rpx; }
.bg-2 { width: 400rpx; height: 400rpx; background: #FBCFE8; top: 200rpx; left: -100rpx; }

.close {
  position: absolute; top: 20rpx; right: 32rpx;
  width: 64rpx; height: 64rpx; line-height: 60rpx; text-align: center;
  font-size: 56rpx; color: #9CA3AF; z-index: 10;
}

/* Hero */
.hero {
  text-align: center; padding: 0 40rpx 40rpx; position: relative; z-index: 2;
}
.crown { font-size: 96rpx; margin-bottom: 16rpx; }
.title {
  font-size: 48rpx; font-weight: 800; color: #1F2937; letter-spacing: 1rpx;
}
.subtitle { font-size: 26rpx; color: #6B7280; margin-top: 16rpx; }

.countdown {
  display: inline-flex; align-items: center; gap: 16rpx;
  margin-top: 32rpx; padding: 16rpx 28rpx;
  background: linear-gradient(135deg, #FEE2E2, #FCE7F3);
  border-radius: 32rpx;
}
.cd-label { font-size: 24rpx; color: #DC2626; font-weight: 600; }
.cd-time { display: flex; align-items: center; gap: 4rpx; }
.cd-num {
  display: inline-block; min-width: 40rpx; padding: 4rpx 8rpx;
  background: #DC2626; color: #fff; border-radius: 6rpx;
  font-size: 22rpx; font-weight: 700; text-align: center;
}
.cd-colon { color: #DC2626; font-weight: 700; }

/* 对比表 */
.compare-card {
  margin: 0 32rpx 32rpx; background: #fff; border-radius: 24rpx;
  padding: 8rpx 0; box-shadow: 0 4rpx 16rpx rgba(0,0,0,.04);
  position: relative; z-index: 2;
}
.compare-head, .compare-row {
  display: grid; grid-template-columns: 1fr 100rpx 100rpx;
  align-items: center; padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #F3F4F6;
}
.compare-row:last-child { border-bottom: none; }
.compare-head {
  background: linear-gradient(135deg, #F5F3FF, #FDF2F8);
  border-radius: 24rpx 24rpx 0 0;
  font-weight: 700;
}
.compare-feature { font-size: 26rpx; color: #1F2937; }
.compare-col {
  text-align: center; font-size: 28rpx; color: #9CA3AF;
  &.vip {
    color: #8B5CF6; font-weight: 700;
  }
}

/* 套餐 */
.plans {
  display: flex; gap: 16rpx; margin: 0 32rpx 32rpx; position: relative; z-index: 2;
}
.plan {
  flex: 1; padding: 32rpx 16rpx; border-radius: 24rpx;
  background: #fff; border: 4rpx solid #E5E7EB;
  text-align: center; position: relative;
  transition: all .2s;
  &.active {
    border-color: #8B5CF6;
    background: linear-gradient(180deg, #FAF5FF, #fff);
    box-shadow: 0 12rpx 32rpx rgba(139,92,246,.2);
    transform: translateY(-4rpx);
  }
}
.badge {
  position: absolute; top: -16rpx; left: 50%; transform: translateX(-50%);
  background: linear-gradient(135deg, #F59E0B, #EF4444);
  color: #fff; font-size: 20rpx; padding: 4rpx 16rpx; border-radius: 16rpx;
  white-space: nowrap;
  font-weight: 600;
}
.plan-period { font-size: 26rpx; color: #6B7280; margin-bottom: 12rpx; }
.price-row {
  display: flex; align-items: baseline; justify-content: center; gap: 4rpx;
}
.currency { font-size: 22rpx; color: #1F2937; }
.price { font-size: 40rpx; font-weight: 800; color: #1F2937; }
.original {
  font-size: 22rpx; color: #9CA3AF; text-decoration: line-through; margin-top: 4rpx;
}
.hint {
  font-size: 22rpx; color: #8B5CF6; font-weight: 600; margin-top: 8rpx;
}
.check-mark {
  position: absolute; top: 12rpx; right: 12rpx;
  width: 36rpx; height: 36rpx; border-radius: 50%;
  background: #8B5CF6; color: #fff; font-size: 22rpx;
  display: flex; align-items: center; justify-content: center;
}

/* 用户评价 */
.reviews { margin-bottom: 32rpx; position: relative; z-index: 2; }
.reviews-title {
  font-size: 26rpx; color: #6B7280;
  text-align: center; margin-bottom: 16rpx;
}
.reviews-scroll { white-space: nowrap; padding-left: 32rpx; }
.review {
  display: inline-block; vertical-align: top; white-space: normal;
  width: 480rpx; margin-right: 16rpx; padding: 24rpx;
  background: #fff; border-radius: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,.04);
}
.review-head { display: flex; align-items: center; gap: 16rpx; margin-bottom: 12rpx; }
.review-avatar {
  width: 64rpx; height: 64rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 32rpx;
}
.review-name { font-size: 24rpx; font-weight: 600; color: #1F2937; }
.review-stars { font-size: 18rpx; }
.review-content { font-size: 24rpx; color: #6B7280; line-height: 1.6; }

/* 福利 */
.benefits {
  margin: 0 32rpx 32rpx; padding: 24rpx;
  background: #fff; border-radius: 20rpx;
  position: relative; z-index: 2;
}
.benefit {
  display: flex; align-items: center; gap: 16rpx;
  padding: 12rpx 0;
}
.benefit-emoji { font-size: 36rpx; flex-shrink: 0; }
.benefit-title { font-size: 26rpx; font-weight: 600; color: #1F2937; }
.benefit-sub { font-size: 22rpx; color: #6B7280; margin-top: 2rpx; }

/* 底部固定按钮 */
.bottom-bar {
  position: fixed; left: 0; right: 0; bottom: 0;
  display: flex; align-items: center; gap: 16rpx;
  padding: 20rpx 32rpx; padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff; box-shadow: 0 -8rpx 24rpx rgba(0,0,0,.08);
  z-index: 20;
}
.bottom-info { flex: 1; }
.bottom-price { font-size: 40rpx; font-weight: 800; color: #1F2937; }
.bottom-period { font-size: 24rpx; color: #6B7280; }
.bottom-tip { display: block; font-size: 22rpx; color: #8B5CF6; margin-top: 4rpx; }
.bottom-btn {
  flex-shrink: 0; min-width: 280rpx; height: 88rpx; line-height: 88rpx;
  background: linear-gradient(135deg, #8B5CF6, #6D28D9);
  color: #fff; border-radius: 44rpx; font-size: 30rpx; font-weight: 700; border: none;
  box-shadow: 0 8rpx 24rpx rgba(139,92,246,.4);
}

.agreement {
  text-align: center; font-size: 20rpx; color: #9CA3AF;
  line-height: 1.6; padding: 16rpx 32rpx;
  position: relative; z-index: 2;
}
</style>
