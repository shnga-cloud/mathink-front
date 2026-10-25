<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref(null)
const loading = ref(false)
const passwordVisible = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
})

const validateUsername = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入用户名'))
  } else if (value.length < 3 || value.length > 20) {
    callback(new Error('用户名长度为3-20位'))
  } else {
    callback()
  }
}

const validatePassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入密码'))
  } else if (value.length < 6 || value.length > 32) {
    callback(new Error('密码长度为6-32位'))
  } else {
    callback()
  }
}

const loginRules = {
  username: [
    { validator: validateUsername, trigger: 'blur' },
    { required: true, validator: validateUsername, trigger: 'submit' },
  ],
  password: [
    { validator: validatePassword, trigger: 'blur' },
    { required: true, validator: validatePassword, trigger: 'submit' },
  ],
}

const togglePasswordVisible = () => {
  passwordVisible.value = !passwordVisible.value
}

const goRegister = () => {
  router.push('/register')
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  try {
    await loginFormRef.value.validate()
  } catch (e) {
    return
  }
  loading.value = true
  try {
    await userStore.login({
      username: loginForm.username,
      password: loginForm.password,
    })
    ElMessage({ message: '登录成功', type: 'success', duration: 1500, offset: 60, showClose: true })
    setTimeout(() => { router.push('/') }, 500)
  } catch (error) {
    // 错误已在 request 拦截器中统一提示
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <!-- 背景层 -->
    <div class="bg-gradient"></div>
    <div class="grid-overlay"></div>

    <!-- 浮动粒子 -->
    <div class="particles">
      <div
        v-for="i in 30"
        :key="i"
        class="particle"
        :style="{
          width: (Math.random() * 4 + 2) + 'px',
          height: (Math.random() * 4 + 2) + 'px',
          left: (Math.random() * 100) + '%',
          animationDuration: (Math.random() * 15 + 10) + 's',
          animationDelay: (Math.random() * 15) + 's',
          opacity: Math.random() * 0.5 + 0.1,
        }"
      ></div>
    </div>

    <!-- 装饰圆环 -->
    <div class="deco-circle" style="width: 600px; height: 600px; top: -200px; right: -200px; animation-delay: 0s;"></div>
    <div class="deco-circle" style="width: 400px; height: 400px; bottom: -100px; left: -150px; animation-delay: 2s;"></div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <div class="card-glow"></div>

      <div class="login-header">
        <div class="logo-ring">
          <span class="logo-icon">M</span>
        </div>
        <h1 class="login-title">MathInk</h1>
        <p class="login-subtitle">欢迎登录数墨平台</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <div class="input-group">
          <label>用户名</label>
          <div class="input-wrapper" :class="{ 'input-error': false }">
            <svg class="icon-left" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              size="large"
              autocomplete="username"
              :disabled="loading"
              :validate-event="false"
            />
          </div>
        </div>

        <div class="input-group">
          <label>密码</label>
          <div class="input-wrapper">
            <svg class="icon-left" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <el-input
              v-model="loginForm.password"
              :type="passwordVisible ? 'text' : 'password'"
              placeholder="请输入密码"
              size="large"
              autocomplete="current-password"
              :disabled="loading"
              :validate-event="false"
            />
            <svg
              class="icon-right"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              @click="togglePasswordVisible"
            >
              <path v-if="!passwordVisible" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle v-if="!passwordVisible" cx="12" cy="12" r="3"></circle>
              <path v-if="passwordVisible" d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line v-if="passwordVisible" x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          </div>
        </div>

        <el-form-item class="form-item-btn" style="margin-bottom: 0;">
          <button type="submit" class="login-btn" :disabled="loading">
            <span v-if="!loading" class="btn-text">登 录</span>
            <span v-else class="btn-text">登 录 中...</span>
          </button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <span>还没有账户？</span>
        <a @click="goRegister">立即注册</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  height: 100vh;
}

/* ========== 表单间距 ========== */
.login-form {
  gap: 20px;
}

/* ========== 装饰元素 ========== */
.deco-circle {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(102, 126, 234, 0.1);
  pointer-events: none;
  animation: pulse 4s ease-in-out infinite;
}

/* ========== 响应式 ========== */
@media (max-width: 480px) {
  .login-card {
    margin: 16px;
    padding: 36px 24px;
    border-radius: 20px;
  }
  .login-title { font-size: 24px; }
}
</style>