<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  SwitchButton, UserFilled, House, Search, EditPen, Clock,
  Camera, DataAnalysis, DataBoard, CircleCheck, CircleClose, AlarmClock,
  Message, Close
} from '@element-plus/icons-vue'
import { getUserStats } from '@/api/recognize'

const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

// ============ 导航 ============
const goHome = () => router.push('/')
const goRecognize = () => router.push('/recognize')
const goHandwrite = () => router.push('/handwrite')
const goHistory = () => router.push('/history')

const isHome = computed(() => route.path === '/')

const isActive = (path) => {
  if (path === '/') return route.path === '/'
  return route.path === path
}

// ============ 登出 ============
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    userStore.logout()
    ElMessage({ message: '已退出登录', type: 'success', duration: 1500, offset: 60 })
    setTimeout(() => router.push('/login'), 500)
  } catch {
    // 取消
  }
}

// ============ 首页统计数据 ============
const statsLoading = ref(false)
const stats = reactive({
  totalCount: 0,
  correctCount: 0,
  wrongCount: 0,
  lastRecognizeAt: null,
})

const accuracy = computed(() => {
  const feedbacked = stats.correctCount + stats.wrongCount
  if (feedbacked === 0) return '--%'
  return ((stats.correctCount / feedbacked) * 100).toFixed(1) + '%'
})

const lastRecognizeText = computed(() => {
  if (!stats.lastRecognizeAt) return '暂无记录'
  const t = typeof stats.lastRecognizeAt === 'string'
    ? stats.lastRecognizeAt
    : new Date(stats.lastRecognizeAt).toLocaleString('zh-CN', { hour12: false })
  return t
})

async function loadStats() {
  statsLoading.value = true
  try {
    const data = await getUserStats()
    if (data) {
      stats.totalCount = data.totalCount ?? 0
      stats.correctCount = data.correctCount ?? 0
      stats.wrongCount = data.wrongCount ?? 0
      stats.lastRecognizeAt = data.lastRecognizeAt ?? null
    }
  } catch {
    // 错误已在拦截器中提示
  } finally {
    statsLoading.value = false
  }
}

// ============ 绑定邮箱 ============
const showBindEmailPopup = ref(false)
const bindEmailForm = ref({ email: '' })
const bindEmailRules = {
  email: [
    { required: true, message: '邮箱不能为空', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
}
const bindEmailFormRef = ref(null)
const bindingEmail = ref(false)

function openBindEmailPopup() {
  bindEmailForm.value.email = ''
  showBindEmailPopup.value = true
}

function closeBindEmailPopup() {
  showBindEmailPopup.value = false
}

async function handleBindEmail() {
  if (!bindEmailFormRef.value) return
  try {
    await bindEmailFormRef.value.validate()
    bindingEmail.value = true
    await userStore.bindEmail(bindEmailForm.value.email)
    showBindEmailPopup.value = false
  } catch {
    // 校验失败或请求失败
  } finally {
    bindingEmail.value = false
  }
}

onMounted(() => {
  // 挂载时加载一次，保证导航栏用户下拉里的统计在任何页面都有数据
  loadStats()
})

// 每次回到首页都重新拉取统计，识别/反馈/删除历史后数据保持最新
// （导航栏下拉与首页仪表盘共用同一 stats 响应式对象，会同步更新）
watch(() => route.path, (p) => {
  if (p === '/') loadStats()
})
</script>

<template>
  <div class="home-layout">
    <!-- 背景层 -->
    <div class="bg-gradient"></div>
    <div class="grid-overlay"></div>

    <!-- 浮动粒子 -->
    <div class="particles">
      <div
        v-for="i in 20"
        :key="i"
        class="particle"
        :style="{
          width: (Math.random() * 4 + 2) + 'px',
          height: (Math.random() * 4 + 2) + 'px',
          left: (Math.random() * 100) + '%',
          animationDuration: (Math.random() * 15 + 10) + 's',
          animationDelay: (Math.random() * 15) + 's',
          opacity: Math.random() * 0.4 + 0.1,
        }"
      ></div>
    </div>

    <!-- 装饰圆环 -->
    <div class="deco-circle" style="width: 500px; height: 500px; top: -150px; right: -100px; animation-delay: 0s;"></div>
    <div class="deco-circle" style="width: 350px; height: 350px; bottom: -80px; left: -100px; animation-delay: 2s;"></div>

    <!-- 顶部导航 -->
    <header class="home-header">
      <div class="header-content">
        <div class="header-left">
          <span class="logo-text" @click="goHome">MathInk</span>
          <nav class="nav-menu">
            <a
              class="nav-link"
              :class="{ active: isActive('/') }"
              @click="goHome"
            >
              <el-icon class="nav-icon"><House /></el-icon>
              首页
            </a>
            <a
              class="nav-link"
              :class="{ active: isActive('/recognize') }"
              @click="goRecognize"
            >
              <el-icon class="nav-icon"><Search /></el-icon>
              公式识别
            </a>
            <a
              class="nav-link"
              :class="{ active: isActive('/handwrite') }"
              @click="goHandwrite"
            >
              <el-icon class="nav-icon"><EditPen /></el-icon>
              手写识别
            </a>
            <a
              class="nav-link"
              :class="{ active: isActive('/history') }"
              @click="goHistory"
            >
              <el-icon class="nav-icon"><Clock /></el-icon>
              历史记录
            </a>
          </nav>
        </div>

        <div class="header-right">
          <el-dropdown trigger="click">
            <div class="user-dropdown-trigger">
              <div class="user-avatar">
                {{ userStore.userInfo.username ? userStore.userInfo.username.charAt(0).toUpperCase() : 'U' }}
              </div>
              <span class="username">{{ userStore.userInfo.username }}</span>
              <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <div class="user-menu">
                <div class="user-profile">
                  <div class="user-avatar-lg">
                    {{ userStore.userInfo.username ? userStore.userInfo.username.charAt(0).toUpperCase() : 'U' }}
                  </div>
                  <div class="user-meta">
                    <div class="user-name">{{ userStore.userInfo.username }}</div>
                    <div class="user-email-row">
                      <span class="user-email">{{ userStore.displayEmail }}</span>
                      <button
                        v-if="!userStore.hasEmail"
                        class="bind-email-link"
                        @click="openBindEmailPopup"
                      >
                        <el-icon><Message /></el-icon>
                        <span>绑定</span>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- 绑定邮箱悬浮表单 -->
                <div v-if="showBindEmailPopup" class="bind-email-popup inline">
                  <div class="popup-header">
                    <span>绑定邮箱</span>
                    <el-icon class="popup-close" @click="closeBindEmailPopup"><Close /></el-icon>
                  </div>
                  <el-form
                    ref="bindEmailFormRef"
                    :model="bindEmailForm"
                    :rules="bindEmailRules"
                    class="bind-email-form"
                    @submit.prevent
                  >
                    <el-form-item prop="email">
                      <el-input
                        v-model="bindEmailForm.email"
                        placeholder="请输入邮箱地址"
                        clearable
                        @keyup.enter="handleBindEmail"
                      >
                        <template #prefix>
                          <el-icon><Message /></el-icon>
                        </template>
                      </el-input>
                    </el-form-item>
                    <button
                      type="button"
                      class="bind-email-submit"
                      :disabled="bindingEmail"
                      @click="handleBindEmail"
                    >
                      <span v-if="!bindingEmail">确认绑定</span>
                      <span v-else>绑定中...</span>
                    </button>
                  </el-form>
                </div>

                <div class="user-stats">
                  <div class="stat-cell">
                    <div class="stat-value">{{ stats.totalCount }}</div>
                    <div class="stat-label">总识别</div>
                  </div>
                  <div class="stat-cell">
                    <div class="stat-value stat-green">{{ stats.correctCount }}</div>
                    <div class="stat-label">正确</div>
                  </div>
                  <div class="stat-cell">
                    <div class="stat-value stat-red">{{ stats.wrongCount }}</div>
                    <div class="stat-label">错误</div>
                  </div>
                  <div class="stat-cell">
                    <div class="stat-value stat-purple">{{ accuracy }}</div>
                    <div class="stat-label">准确率</div>
                  </div>
                </div>
                <div class="user-menu-actions">
                  <button class="menu-btn" @click="goHistory">
                    <el-icon><Clock /></el-icon>
                    <span>历史记录</span>
                  </button>
                  <button class="menu-btn" @click="goRecognize">
                    <el-icon><Search /></el-icon>
                    <span>公式识别</span>
                  </button>
                </div>
                <div class="user-menu-footer">
                  <button class="logout-btn" @click="handleLogout">
                    <el-icon><SwitchButton /></el-icon>
                    <span>退出登录</span>
                  </button>
                </div>
              </div>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <!-- 主体 -->
    <main class="home-outlet">
      <!-- 首页 Dashboard -->
      <template v-if="isHome">
        <div class="home-dashboard">
          <!-- 欢迎卡片 -->
          <div class="welcome-card">
            <div class="card-glow-top"></div>
            <h1 class="welcome-title">欢迎使用 MathInk</h1>
            <p class="welcome-desc">数学墨迹平台 - 让数学学习与创作更高效</p>
          </div>

          <!-- 数据统计 -->
          <div class="stats-section">
            <div class="stats-grid" v-loading="statsLoading" element-loading-background="rgba(11,11,20,0.8)">
              <div class="stats-item stats-total">
                <div class="stats-icon-wrap">
                  <el-icon class="stats-icon"><DataBoard /></el-icon>
                </div>
                <div class="stats-info">
                  <div class="stats-label">累计识别</div>
                  <div class="stats-value">{{ stats.totalCount }}</div>
                  <div class="stats-sub">次</div>
                </div>
              </div>

              <div class="stats-item stats-correct">
                <div class="stats-icon-wrap">
                  <el-icon class="stats-icon"><CircleCheck /></el-icon>
                </div>
                <div class="stats-info">
                  <div class="stats-label">反馈正确</div>
                  <div class="stats-value">{{ stats.correctCount }}</div>
                  <div class="stats-sub">次</div>
                </div>
              </div>

              <div class="stats-item stats-wrong">
                <div class="stats-icon-wrap">
                  <el-icon class="stats-icon"><CircleClose /></el-icon>
                </div>
                <div class="stats-info">
                  <div class="stats-label">反馈错误</div>
                  <div class="stats-value">{{ stats.wrongCount }}</div>
                  <div class="stats-sub">次</div>
                </div>
              </div>

              <div class="stats-item stats-accuracy">
                <div class="stats-icon-wrap">
                  <el-icon class="stats-icon"><DataAnalysis /></el-icon>
                </div>
                <div class="stats-info">
                  <div class="stats-label">正确率</div>
                  <div class="stats-value">{{ accuracy }}</div>
                  <div class="stats-sub">
                    <el-icon style="margin-right: 4px; font-size: 12px"><AlarmClock /></el-icon>
                    <span>最后识别：{{ lastRecognizeText }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 功能模块 -->
          <div class="features-section">
            <div class="feature-grid">
              <div class="feature-item feature-clickable" @click="goRecognize">
                <div class="feature-icon-wrap icon-blue">
                  <el-icon><Camera /></el-icon>
                </div>
                <h3 class="feature-title">公式识别</h3>
                <p class="feature-desc">上传手写公式图片，AI 自动识别为 LaTeX</p>
                <div class="feature-enter">
                  <el-icon style="margin-right: 4px"><Camera /></el-icon>
                  <span>开始识别</span>
                </div>
              </div>

              <div class="feature-item feature-clickable" @click="goHandwrite">
                <div class="feature-icon-wrap icon-purple">
                  <el-icon><EditPen /></el-icon>
                </div>
                <h3 class="feature-title">手写识别</h3>
                <p class="feature-desc">无需拍照，直接在画板上手写公式进行识别</p>
                <div class="feature-enter feature-enter-purple">
                  <el-icon style="margin-right: 4px"><EditPen /></el-icon>
                  <span>立即手写</span>
                </div>
              </div>

              <div class="feature-item feature-clickable" @click="goHistory">
                <div class="feature-icon-wrap icon-green">
                  <el-icon><Clock /></el-icon>
                </div>
                <h3 class="feature-title">历史记录</h3>
                <p class="feature-desc">查看所有识别历史，支持重新渲染、复制与反馈</p>
                <div class="feature-enter feature-enter-green">
                  <el-icon style="margin-right: 4px"><Clock /></el-icon>
                  <span>查看记录</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 子路由 -->
      <router-view v-else />
    </main>
  </div>
</template>

<style scoped>
/* ============ 全局背景层 ============ */
.home-layout {
  min-height: 100vh;
  background: #0b0b14;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
}

/* 背景层（bg-gradient / grid-overlay / particles / particle）公共样式已抽取到 App.vue */

/* 装饰圆环（本页 fixed 定位覆盖） */
.deco-circle {
  position: fixed;
  border-radius: 50%;
  border: 1px solid rgba(102, 126, 234, 0.08);
  pointer-events: none;
  animation: pulse 4s ease-in-out infinite;
  z-index: 0;
}

/* ============ 顶部导航 ============ */
.home-header {
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
  background: rgba(11, 11, 20, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 32px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 40px;
  min-width: 0;
}

.logo-text {
  font-size: 22px;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #a78bfa 50%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  cursor: pointer;
  flex-shrink: 0;
  letter-spacing: 1px;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  text-decoration: none;
}

.nav-link:hover {
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.05);
}

.nav-link.active {
  color: #a78bfa;
  background: rgba(167, 139, 250, 0.08);
  position: relative;
}

.nav-link.active::after {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: -16px;
  height: 3px;
  background: linear-gradient(90deg, #667eea 0%, #a78bfa 100%);
  border-radius: 2px;
}

.nav-icon {
  margin-right: 6px;
  font-size: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ============ 绑定邮箱 ============ */
.user-email-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.user-email {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bind-email-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid rgba(139, 92, 246, 0.4);
  background: rgba(139, 92, 246, 0.12);
  color: #c4b5fd;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.bind-email-link:hover {
  background: rgba(139, 92, 246, 0.25);
  color: #ddd6fe;
  border-color: rgba(139, 92, 246, 0.6);
}

.bind-email-link .el-icon {
  font-size: 12px;
}

.bind-email-popup {
  width: 100%;
  background: rgba(30, 30, 50, 0.98);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 14px;
  margin-top: 12px;
  animation: popupFadeIn 0.2s ease-out;
}

.bind-email-popup.inline {
  position: relative;
  margin-top: 10px;
}

@keyframes popupFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.popup-close {
  cursor: pointer;
  color: rgba(255, 255, 255, 0.5);
  transition: color 0.2s;
  font-size: 18px;
}

.popup-close:hover {
  color: #fff;
}

.bind-email-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.bind-email-form :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: none;
}

.bind-email-form :deep(.el-input__wrapper:hover) {
  border-color: rgba(139, 92, 246, 0.4);
}

.bind-email-form :deep(.el-input__wrapper.is-focus) {
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.3);
}

.bind-email-form :deep(.el-input__inner) {
  color: #fff;
}

.bind-email-form :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.4);
}

.bind-email-form :deep(.el-input__prefix) {
  color: rgba(255, 255, 255, 0.4);
}

.bind-email-submit {
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
}

.bind-email-submit:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.bind-email-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.user-dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 14px;
  border-radius: 10px;
  transition: all 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.user-dropdown-trigger:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(102, 126, 234, 0.3);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.username {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.dropdown-arrow {
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
  transition: transform 0.3s;
}

.user-dropdown-trigger:hover .dropdown-arrow {
  transform: rotate(180deg);
}

/* 下拉菜单深色样式 */
/* ============ 用户下拉菜单 ============ */
:deep(.el-dropdown-menu) {
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  min-width: 0 !important;
}

.user-menu {
  width: 260px;
  background: rgba(20, 20, 35, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 16px;
  backdrop-filter: blur(16px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  color: #fff;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.user-avatar-lg {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
}

.user-meta {
  min-width: 0;
  flex: 1;
}

.user-name {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  line-height: 1.3;
}

.user-email {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.stat-cell {
  text-align: center;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.stat-value.stat-green { color: #34d399; }
.stat-value.stat-red { color: #f87171; }
.stat-value.stat-purple { color: #a78bfa; }

.stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  margin-top: 4px;
}

.user-menu-actions {
  display: flex;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.menu-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-btn:hover {
  background: rgba(102, 126, 234, 0.15);
  color: #a78bfa;
  border-color: rgba(167, 139, 250, 0.3);
}

.menu-btn .el-icon {
  font-size: 14px;
}

.user-menu-footer {
  padding-top: 12px;
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: rgba(248, 113, 113, 0.15);
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.3);
}

/* ============ 主体内容 ============ */
.home-outlet {
  flex: 1;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.home-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* ============ 欢迎卡片 ============ */
.welcome-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 48px 56px;
  text-align: center;
  position: relative;
  overflow: hidden;
  animation: cardAppear 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

.card-glow-top {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.5), rgba(167, 139, 250, 0.5), transparent);
  border-radius: 2px;
}

.welcome-title {
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 12px 0;
  letter-spacing: 1px;
}

.welcome-desc {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0;
  letter-spacing: 0.5px;
}

/* ============ 数据统计卡片 ============ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  animation: cardAppear 0.8s 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

.stats-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stats-item:hover {
  border-color: rgba(102, 126, 234, 0.2);
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.1);
  transform: translateY(-2px);
}

.stats-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  border-radius: 2px;
  opacity: 0.6;
}

.stats-total::before { background: linear-gradient(90deg, #667eea, #5b8def); }
.stats-correct::before { background: linear-gradient(90deg, #10b981, #34d399); }
.stats-wrong::before { background: linear-gradient(90deg, #ef4444, #f87171); }
.stats-accuracy::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }

.stats-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stats-total .stats-icon-wrap {
  background: rgba(102, 126, 234, 0.12);
  color: #818cf8;
}
.stats-correct .stats-icon-wrap {
  background: rgba(16, 185, 129, 0.12);
  color: #34d399;
}
.stats-wrong .stats-icon-wrap {
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
}
.stats-accuracy .stats-icon-wrap {
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
}

.stats-icon {
  font-size: 24px;
}

.stats-info {
  flex: 1;
  min-width: 0;
}

.stats-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 6px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.stats-value {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.stats-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  margin-top: 4px;
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ============ 功能模块卡片 ============ */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  animation: cardAppear 0.8s 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

.feature-item {
  padding: 36px 28px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.feature-item:hover {
  transform: translateY(-6px);
  border-color: rgba(102, 126, 234, 0.25);
  box-shadow: 0 20px 50px rgba(102, 126, 234, 0.15), 0 0 0 1px rgba(102, 126, 234, 0.1);
}

.feature-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  border-radius: 2px;
  opacity: 0.6;
}

.feature-item:nth-child(1)::before { background: linear-gradient(90deg, #667eea, #5b8def); }
.feature-item:nth-child(2)::before { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
.feature-item:nth-child(3)::before { background: linear-gradient(90deg, #10b981, #34d399); }

.feature-icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 28px;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}

.icon-blue {
  background: linear-gradient(135deg, #667eea 0%, #5b8def 100%);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}
.icon-purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
}
.icon-green {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
}

.feature-title {
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 10px 0;
}

.feature-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
  margin: 0 0 24px 0;
  line-height: 1.7;
  min-height: 48px;
}

.feature-enter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.feature-enter::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
  transition: left 0.6s ease;
}

.feature-item:hover .feature-enter::after {
  left: 100%;
}

.feature-enter-purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
}
.feature-enter-green {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

/* ============ 响应式 ============ */
@media (max-width: 1000px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .feature-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 820px) {
  .nav-menu { display: none; }
  .header-left { gap: 12px; }
  .header-content { padding: 0 20px; }
}
@media (max-width: 768px) {
  .feature-grid { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: 1fr; }
  .welcome-card { padding: 32px 24px; }
  .welcome-title { font-size: 24px; }
}
</style>