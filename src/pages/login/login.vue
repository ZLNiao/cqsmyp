<template>
  <view class="login">
    <view class="bg-blob bg-1" />
    <view class="bg-blob bg-2" />

    <view class="close" @click="onClose">×</view>

    <!-- Logo + 标题 -->
    <view class="hero">
      <view class="logo">
        <view class="logo-bg" />
        <text class="logo-emoji">✨</text>
      </view>
      <view class="title">欢迎来到 GlamUp</view>
      <view class="subtitle">用 AI 找到最适合你的妆容</view>
    </view>

    <!-- 表单 -->
    <view class="form">
      <view class="input-row">
        <text class="prefix">+86</text>
        <input
          v-model="phone"
          class="input"
          type="number"
          maxlength="11"
          placeholder="请输入手机号"
          placeholder-class="input-placeholder"
        />
      </view>

      <view class="input-row">
        <input
          v-model="code"
          class="input"
          type="number"
          maxlength="6"
          placeholder="6 位验证码"
          placeholder-class="input-placeholder"
        />
        <text
          class="send"
          :class="{ disabled: countdown > 0 || sending }"
          @click="onSendSms"
        >{{ countdown > 0 ? `${countdown}s 后重发` : (sending ? '发送中…' : '获取验证码') }}</text>
      </view>

      <button class="btn" :disabled="!canLogin" :loading="logging" @click="onLogin">
        登录 / 注册
      </button>

      <view class="agree">
        <view class="checkbox" :class="{ checked: agreed }" @click="agreed = !agreed">
          <text v-if="agreed" class="checkmark">✓</text>
        </view>
        <view class="agree-text">
          <text @click="agreed = !agreed">我已阅读并同意</text>
          <text class="link" @click="goAgreement('user')">《用户协议》</text>
          <text @click="agreed = !agreed">和</text>
          <text class="link" @click="goAgreement('privacy')">《隐私政策》</text>
        </view>
      </view>
    </view>

    <view class="footer">
      <text>登录后可使用全部 AI 美颜分析功能</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { sendSms, loginByPhone } from '@/api/user'
import { useUserStore } from '@/store/user'

const user = useUserStore()

const phone = ref('')
const code = ref('')
const agreed = ref(false)

const countdown = ref(0)
const sending = ref(false)
const logging = ref(false)

let timer = null

const phoneValid = computed(() => /^1[3-9]\d{9}$/.test(phone.value))
const codeValid = computed(() => /^\d{6}$/.test(code.value))
const canLogin = computed(() => phoneValid.value && codeValid.value && agreed.value && !logging.value)

const startCountdown = () => {
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

const onSendSms = async () => {
  if (countdown.value > 0 || sending.value) return
  if (!phoneValid.value) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  if (!agreed.value) {
    uni.showToast({ title: '请先同意用户协议', icon: 'none' })
    return
  }

  sending.value = true
  try {
    await sendSms(phone.value)
    uni.showToast({ title: '验证码已发送', icon: 'success' })
    startCountdown()
  } catch (e) {
    // request.js 已经统一弹错误 toast
  } finally {
    sending.value = false
  }
}

const onLogin = async () => {
  if (!canLogin.value) return
  logging.value = true
  try {
    const { token, user: profile } = await loginByPhone(phone.value, code.value)
    user.setToken(token)
    user.setProfile(profile)
    uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 800)
  } catch (e) {
    // 错误 toast 已由 request.js 处理
  } finally {
    logging.value = false
  }
}

const onClose = () => uni.navigateBack()

const goAgreement = (type) => {
  uni.navigateTo({ url: `/pages/agreement/agreement?type=${type}` })
}

onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style lang="scss" scoped>
.login {
  position: relative; min-height: 100vh;
  background: linear-gradient(180deg, #FAF5FF 0%, #FDF2F8 50%, #F8F9FA 100%);
  padding: 0 60rpx 60rpx; overflow: hidden;
}
.bg-blob {
  position: absolute; border-radius: 50%; filter: blur(80rpx); opacity: .5;
  pointer-events: none;
}
.bg-1 { width: 500rpx; height: 500rpx; background: #C4B5FD; top: -100rpx; right: -100rpx; }
.bg-2 { width: 400rpx; height: 400rpx; background: #FBCFE8; top: 300rpx; left: -100rpx; }

.close {
  position: absolute; top: 80rpx; right: 32rpx;
  width: 64rpx; height: 64rpx; line-height: 60rpx; text-align: center;
  font-size: 56rpx; color: #9CA3AF; z-index: 10;
}

/* Hero */
.hero { padding-top: 200rpx; text-align: center; position: relative; z-index: 2; }
.logo {
  position: relative; width: 160rpx; height: 160rpx; margin: 0 auto 32rpx;
  display: flex; align-items: center; justify-content: center;
}
.logo-bg {
  position: absolute; inset: 0; border-radius: 40rpx;
  background: linear-gradient(135deg, #8B5CF6, #EC4899);
  box-shadow: 0 16rpx 40rpx rgba(139, 92, 246, .35);
}
.logo-emoji { position: relative; font-size: 80rpx; z-index: 2; }
.title {
  font-size: 48rpx; font-weight: 800; letter-spacing: 1rpx; color: #1F2937;
}
.subtitle {
  font-size: 26rpx; color: #6B7280; margin-top: 12rpx;
}

/* 表单 */
.form { margin-top: 80rpx; position: relative; z-index: 2; }
.input-row {
  display: flex; align-items: center; gap: 16rpx;
  height: 96rpx; padding: 0 32rpx;
  background: #fff; border-radius: 48rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, .04);
  margin-bottom: 24rpx;
}
.prefix {
  font-size: 30rpx; color: #1F2937; font-weight: 600;
  padding-right: 16rpx; border-right: 2rpx solid #E5E7EB;
}
.input {
  flex: 1; height: 100%; font-size: 30rpx; color: #1F2937;
}
.input-placeholder { color: #9CA3AF; }
.send {
  flex-shrink: 0;
  font-size: 26rpx; color: #8B5CF6; font-weight: 600;
  padding: 12rpx 20rpx; border-radius: 32rpx;
  background: rgba(139, 92, 246, .1);
  &.disabled { color: #9CA3AF; background: #F3F4F6; }
}

.btn {
  height: 96rpx; line-height: 96rpx; margin-top: 24rpx;
  background: linear-gradient(135deg, #8B5CF6, #6D28D9);
  color: #fff; border-radius: 48rpx;
  font-size: 32rpx; font-weight: 700; border: none;
  box-shadow: 0 16rpx 40rpx rgba(139, 92, 246, .4);
  &[disabled] {
    background: #E5E7EB; color: #9CA3AF; box-shadow: none;
  }
}

/* 协议 */
.agree {
  display: flex; align-items: flex-start; gap: 12rpx;
  margin-top: 32rpx; padding: 0 8rpx;
}
.checkbox {
  width: 32rpx; height: 32rpx; border-radius: 50%;
  border: 2rpx solid #D1D5DB; flex-shrink: 0; margin-top: 4rpx;
  display: flex; align-items: center; justify-content: center;
  transition: all .2s;
  &.checked {
    background: linear-gradient(135deg, #8B5CF6, #6D28D9);
    border-color: transparent;
  }
}
.checkmark { color: #fff; font-size: 22rpx; font-weight: 700; }
.agree-text {
  font-size: 24rpx; color: #6B7280; line-height: 1.5;
}
.link { color: #8B5CF6; }

.footer {
  text-align: center; font-size: 22rpx; color: #9CA3AF;
  margin-top: 60rpx; position: relative; z-index: 2;
}
</style>
