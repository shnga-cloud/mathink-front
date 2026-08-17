import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false, title: '登录' },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/Register.vue'),
      meta: { requiresAuth: false, title: '注册' },
    },
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/Home.vue'),
      meta: { requiresAuth: true, title: '首页' },
      children: [
        {
          path: 'recognize',
          name: 'Recognize',
          component: () => import('@/views/Recognize.vue'),
          meta: { requiresAuth: true, title: '公式识别' },
        },
        {
          path: 'handwrite',
          name: 'Handwrite',
          component: () => import('@/views/Handwrite.vue'),
          meta: { requiresAuth: true, title: '手写识别' },
        },
        {
          path: 'history',
          name: 'History',
          component: () => import('@/views/History.vue'),
          meta: { requiresAuth: true, title: '历史记录' },
        },
      ],
    },
  ],
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  const isLoggedIn = userStore.isLoggedIn

  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - MathInk`
  } else {
    document.title = 'MathInk'
  }

  // 需要登录的路由
  if (to.meta.requiresAuth) {
    if (!isLoggedIn) {
      next({
        path: '/login',
        query: { redirect: to.fullPath },
      })
    } else {
      next()
    }
  } else {
    // 登录/注册等免登录路由，已登录则跳首页
    if ((to.path === '/login' || to.path === '/register') && isLoggedIn) {
      next('/')
    } else {
      next()
    }
  }
})

export default router
