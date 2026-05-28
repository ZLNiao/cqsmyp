<template>
  <el-container class="layout">
    <!-- 侧边栏 -->
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <span class="logo-emoji">✨</span>
        <span class="logo-text">GlamUp Admin</span>
      </div>
      <el-menu
        :default-active="$route.path"
        router
        background-color="transparent"
        text-color="rgba(255,255,255,.85)"
        active-text-color="#fff"
      >
        <el-menu-item
          v-for="route in menuRoutes"
          :key="route.path"
          :index="`/${route.path}`"
        >
          <el-icon><component :is="route.meta.icon" /></el-icon>
          <span>{{ route.meta.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶部 -->
      <el-header class="topbar">
        <span class="page-title-bar">{{ $route.meta.title }}</span>
        <el-dropdown @command="onCommand">
          <span class="user">
            👤 {{ auth.admin?.username }}
            <el-tag v-if="auth.isSuper" size="small" type="danger" effect="dark">SUPER</el-tag>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <el-main>
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  DataLine, User, Tickets, PictureFilled, Star, ArrowDown
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const auth = useAuthStore()

// 取出菜单路由（除了 layout 自身和 login）
const menuRoutes = computed(() => {
  const layout = router.options.routes.find((r) => r.path === '/')
  return layout?.children || []
})

const onCommand = (cmd) => {
  if (cmd === 'logout') {
    auth.logout()
    router.push('/login')
  }
}
</script>

<style lang="scss" scoped>
.layout { height: 100vh; }

.sidebar {
  background: linear-gradient(180deg, #6D28D9 0%, #4C1D95 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
}
.logo {
  display: flex; align-items: center; gap: 8px;
  padding: 20px 24px;
  font-size: 18px; font-weight: 700;
  border-bottom: 1px solid rgba(255,255,255,.1);
}
.logo-emoji { font-size: 24px; }

:deep(.el-menu) { border-right: none; }
:deep(.el-menu-item) {
  height: 50px; line-height: 50px;
  margin: 4px 12px;
  border-radius: 8px;
  &:hover { background: rgba(255,255,255,.1) !important; }
  &.is-active {
    background: rgba(255,255,255,.18) !important;
    font-weight: 600;
  }
}

.topbar {
  background: #fff;
  border-bottom: 1px solid #F3F4F6;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px;
}
.page-title-bar {
  font-size: 18px; font-weight: 700;
}
.user {
  display: flex; align-items: center; gap: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #1F2937;
}

.el-main {
  background: #F8F9FA;
  padding: 20px;
}
</style>
