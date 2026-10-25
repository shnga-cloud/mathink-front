<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { register } from '@/api/user'

const router = useRouter()

const registerFormRef = ref(null)
const loading = ref(false)
const passwordVisible = ref(false)
const confirmPasswordVisible = ref(false)

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
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

const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const validateEmail = (rule, value, callback) => {
  if (!value) {
    callback()
    return
  }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(value)) {
    callback(new Error('邮箱格式不正确'))
  } else {
    callback()
  }
}

const registerRules = {
  username: [
    { validator: validateUsername, trigger: 'blur' },
    { required: true, validator: validateUsername, trigger: 'submit' },
  ],
  password: [
    { validator: validatePassword, trigger: 'blur' },
    { required: true, validator: validatePassword, trigger: 'submit' },
  ],
  confirmPassword: [
    { validator: validateConfirmPassword, trigger: 'blur' },
    { required: true, validator: validateConfirmPassword, trigger: 'submit' },
  ],
  email: [
    { validator: validateEmail, trigger: 'blur' },
  ],
}

const togglePasswordVisible = () => {
  passwordVisible.value = !passwordVisible.value
}

const toggleConfirmPasswordVisible = () => {
  confirmPasswordVisible.value = !confirmPasswordVisible.value
}

const handleRegister = async () => {
  if (!registerFormRef.value) return

  try {
    await registerFormRef.value.validate()
  } catch (e) {
    return
  }

  loading.value = true

  try {
    await register({
      username: registerForm.username,
      password: registerForm.password,
      email: registerForm.email || null,
    })

    ElMessage({
      message: '注册成功，请登录',
      type: 'success',
      duration: 2000,
      offset: 60,
      showClose: true,
    })

    setTimeout(() => {
      router.push('/login')
    }, 800)
  } catch (error) {
    // 后端返回的错误已在request拦截器中统一用顶部ElMessage提示
  } finally {
    loading.value = false
  }
}

const goLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="register-page">
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

    <!-- 注册卡片 -->
    <div class="register-card">
      <div class="card-glow"></div>

      <div class="register-header">
        <div class="logo-ring">
          <span class="logo-icon">M</span>
        </div>
        <h1 class="register-title">MathInk</h1>
        <p class="register-subtitle">创建账户，开始使用数墨平台</p>
      </div>

      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
        @submit.prevent="handleRegister"
      >
        <div class="input-group">
          <label>用户名</label>
          <div class="input-wrapper">
            <svg class="icon-left" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <el-input
              v-model="registerForm.username"
              placeholder="请输入用户名（3-20位）"
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
              v-model="registerForm.password"
              :type="passwordVisible ? 'text' : 'password'"
              placeholder="请输入密码（6-32位）"
              size="large"
              autocomplete="new-password"
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

        <div class="input-group">
          <label>确认密码</label>
          <div class="input-wrapper">
            <svg class="icon-left" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <el-input
              v-model="registerForm.confirmPassword"
              :type="confirmPasswordVisible ? 'text' : 'password'"
              placeholder="请再次输入密码"
              size="large"
              autocomplete="new-password"
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
              @click="toggleConfirmPasswordVisible"
            >
              <path v-if="!confirmPasswordVisible" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle v-if="!confirmPasswordVisible" cx="12" cy="12" r="3"></circle>
              <path v-if="confirmPasswordVisible" d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line v-if="confirmPasswordVisible" x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          </div>
        </div>

        <div class="input-group">
          <label>邮箱 <span class="label-optional">（选填）</span></label>
          <div class="input-wrapper">
            <svg class="icon-left" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <el-input
              v-model="registerForm.email"
              placeholder="请输入邮箱"
              size="large"
              autocomplete="email"
              :disabled="loading"
              :validate-event="false"
            />
          </div>
        </div>

        <el-form-item class="form-item-btn" style="margin-bottom: 0;">
          <button type="submit" class="register-btn" :disabled="loading">
            <span v-if="!loading" class="btn-text">注 册</span>
            <span v-else class="btn-text">注册中...</span>
          </button>
        </el-form-item>
      </el-form>

      <div class="register-footer">
        <span>已有账户？</span>
        <a @click="goLogin">立即登录</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 公共样式（背景层 / 卡片 / 表单 / 按钮 / 动画）已抽取到 App.vue，此处仅保留本页差异覆盖 */
.register-page {
  padding: 20px;
}

/* ========== 本页差异覆盖 ========== */
.register-form {
  gap: 18px;
}

.register-header {
  margin-bottom: 36px;
}

.register-footer {
  margin-top: 24px;
}

.label-optional {
  color: rgba(255, 255, 255, 0.25);
  text-transform: none;
  font-weight: 400;
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
  .register-card {
    margin: 16px;
    padding: 36px 24px;
    border-radius: 20px;
  }
  .register-title { font-size: 24px; }
}
</style>