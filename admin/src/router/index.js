import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'dashboard', component: () => import('@/pages/Dashboard.vue'), meta: { title: '仪表盘', icon: 'DataLine' } },
      { path: 'users', name: 'users', component: () => import('@/pages/Users.vue'), meta: { title: '用户管理', icon: 'User' } },
      { path: 'orders', name: 'orders', component: () => import('@/pages/Orders.vue'), meta: { title: '订单管理', icon: 'Tickets' } },
      { path: 'analyses', name: 'analyses', component: () => import('@/pages/Analyses.vue'), meta: { title: '分析记录', icon: 'PictureFilled' } },
      { path: 'celebrities', name: 'celebrities', component: () => import('@/pages/Celebrities.vue'), meta: { title: '明星人脸库', icon: 'Star' } }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, _, next) => {
  const auth = useAuthStore()
  if (to.meta.public) return next()
  if (!auth.token) return next('/login')
  next()
})

export default router
