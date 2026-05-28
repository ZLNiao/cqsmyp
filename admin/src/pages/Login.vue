<template>
  <div class="login">
    <div class="bg-blob blob-1" />
    <div class="bg-blob blob-2" />

    <div class="card">
      <div class="hero">
        <div class="logo-circle">
          <span>✨</span>
        </div>
        <div class="title">GlamUp 管理后台</div>
        <div class="subtitle">仅限授权管理员登录</div>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="onSubmit">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" size="large" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" size="large" placeholder="请输入密码" show-password @keyup.enter="onSubmit" />
        </el-form-item>
        <el-button type="primary" size="large" class="btn" :loading="loading" @click="onSubmit">
          登 录
        </el-button>
      </el-form>

      <div class="footer-tip">
        <span>默认账号：admin / admin123（生产环境请立即修改）</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '@/api/admin'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const auth = useAuthStore()

const formRef = ref()
const loading = ref(false)
const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const onSubmit = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    const data = await login(form)
    auth.login(data.token, data.admin)
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #FAF5FF 0%, #FDF2F8 50%, #F8F9FA 100%);
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.bg-blob {
  position: absolute; border-radius: 50%; filter: blur(80px); opacity: .5;
}
.blob-1 { width: 400px; height: 400px; background: #C4B5FD; top: -100px; right: -100px; }
.blob-2 { width: 350px; height: 350px; background: #FBCFE8; bottom: -100px; left: -100px; }

.card {
  position: relative; z-index: 2;
  width: 420px;
  background: #fff;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(139, 92, 246, .15);
}
.hero { text-align: center; margin-bottom: 32px; }
.logo-circle {
  width: 80px; height: 80px; border-radius: 24px;
  background: linear-gradient(135deg, #8B5CF6, #6D28D9);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
  font-size: 40px;
  box-shadow: 0 12px 32px rgba(139, 92, 246, .35);
}
.title { font-size: 24px; font-weight: 800; color: #1F2937; }
.subtitle { font-size: 13px; color: #6B7280; margin-top: 8px; }

.btn { width: 100%; margin-top: 8px; }

.footer-tip {
  margin-top: 24px;
  text-align: center;
  font-size: 12px;
  color: #9CA3AF;
}
</style>
