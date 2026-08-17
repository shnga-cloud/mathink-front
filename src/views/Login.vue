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
/* ========== 背景层 ========== */
.login-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #0f0f1a;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 20%, rgba(102, 126, 234, 0.25) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(118, 75, 162, 0.2) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(102, 126, 234, 0.08) 0%, transparent 70%),
    linear-gradient(135deg, #0a0a1a 0%, #12122a 40%, #1a1a3a 70%, #0f0f1a 100%);
  animation: bgShift 20s ease-in-out infinite alternate;
}

@keyframes bgShift {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(15deg); }
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(102, 126, 234, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(102, 126, 234, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
}

/* 浮动粒子 */
.particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.particle {
  position: absolute;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.4);
  filter: blur(1px);
  animation: floatUp linear infinite;
}

@keyframes floatUp {
  0% { transform: translateY(100vh) scale(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-10vh) scale(1); opacity: 0; }
}

/* ========== 卡片主体 ========== */
.login-card {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 440px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 48px 40px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  animation: cardAppear 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(30px);
}

@keyframes cardAppear {
  to { opacity: 1; transform: translateY(0); }
}

.card-glow {
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.6), rgba(118, 75, 162, 0.6), transparent);
  border-radius: 2px;
}

/* ========== 头部区域 ========== */
.login-header {
  text-align: center;
  margin-bottom: 40px;
  animation: fadeInUp 0.6s 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

@keyframes fadeInUp {
  to { opacity: 1; transform: translateY(0); }
}

.logo-ring {
  width: 72px;
  height: 72px;
  margin: 0 auto 20px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-ring::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid transparent;
  background: linear-gradient(135deg, #667eea, #764ba2) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: spin 8s linear infinite;
}

.logo-ring::after {
  content: '';
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15));
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.logo-icon {
  position: relative;
  z-index: 2;
  font-size: 28px;
  font-weight: 900;
  background: linear-gradient(135deg, #667eea 0%, #a78bfa 50%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px 0;
  letter-spacing: 2px;
}

.login-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
  letter-spacing: 1px;
}

/* ========== 表单区域 ========== */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeInUp 0.6s 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

.input-group label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0 16px;
  height: 52px;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(102, 126, 234, 0.5);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 0 20px rgba(102, 126, 234, 0.1);
}

.input-wrapper .icon-left {
  color: rgba(255, 255, 255, 0.3);
  margin-right: 12px;
  flex-shrink: 0;
  transition: color 0.3s;
}

.input-wrapper:focus-within .icon-left {
  color: #667eea;
}

.input-wrapper :deep(.el-input__wrapper) {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
}

.input-wrapper :deep(.el-input__inner) {
  color: #ffffff !important;
  font-size: 15px;
  height: 100%;
}

.input-wrapper :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.25) !important;
}

.input-wrapper .icon-right {
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 8px;
  transition: color 0.2s;
}

.input-wrapper .icon-right:hover {
  color: #667eea;
}

/* ========== 登录按钮 ========== */
.login-btn {
  position: relative;
  width: 100%;
  height: 52px;
  margin-top: 8px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 3px;
  cursor: pointer;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

.login-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.3s;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4), 0 0 0 1px rgba(102, 126, 234, 0.3);
}

.login-btn:hover::before {
  opacity: 1;
}

.login-btn:active {
  transform: translateY(0);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.login-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  transition: left 0.6s ease;
}

.login-btn:hover::after {
  left: 100%;
}

.btn-text {
  position: relative;
  z-index: 2;
}

/* ========== 底部区域 ========== */
.login-footer {
  text-align: center;
  margin-top: 28px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.35);
  animation: fadeInUp 0.6s 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

.login-footer a {
  color: #a78bfa;
  font-weight: 500;
  margin-left: 4px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s;
  position: relative;
}

.login-footer a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background: linear-gradient(90deg, #667eea, #a78bfa);
  transition: width 0.3s ease;
}

.login-footer a:hover {
  color: #c4b5fd;
}

.login-footer a:hover::after {
  width: 100%;
}

/* ========== 装饰元素 ========== */
.deco-circle {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(102, 126, 234, 0.1);
  pointer-events: none;
  animation: pulse 4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.05); }
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