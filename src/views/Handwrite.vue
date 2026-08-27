<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick, toRefs } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  EditPen, Delete, Check, Close, DocumentCopy, Refresh, ArrowDown, Sort
} from '@element-plus/icons-vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useHandwriteStore } from '@/stores/handwrite'

const hwStore = useHandwriteStore()
const { status, result, feedbackGiven, feedbackType, penSize, hasContent, canvasDataUrl, mode } = toRefs(hwStore)

// ============ 识别模式 ============
const modeLabel = computed(() => (mode.value === 'chem' ? '化学公式' : '数学公式'))
function toggleMode() {
  if (status.value === 'recognizing') {
    ElMessage({ message: '识别中，无法切换模式', type: 'warning', duration: 1500, offset: 60 })
    return
  }
  hwStore.setMode(mode.value === 'math' ? 'chem' : 'math')
}

// ============ Canvas 绘图 ============
const canvasRef = ref(null)
const ctx = ref(null)
const isDrawing = ref(false)
const lastX = ref(0)
const lastY = ref(0)
const cursorVisible = ref(false)
const cursorX = ref(0)
const cursorY = ref(0)

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  const c = canvas.getContext('2d')
  c.scale(dpr, dpr)
  c.fillStyle = '#ffffff'
  c.fillRect(0, 0, rect.width, rect.height)
  c.strokeStyle = '#1a1a2e'
  c.lineWidth = penSize.value
  c.lineCap = 'round'
  c.lineJoin = 'round'
  ctx.value = c
}

/** 从 store 恢复画板内容 */
function restoreCanvas() {
  if (!canvasDataUrl.value) return
  const c = ctx.value
  if (!c) return
  const img = new Image()
  img.onload = () => {
    const canvas = canvasRef.value
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    // 画到白色背景上（initCanvas 已填过白底）
    c.drawImage(img, 0, 0, rect.width, rect.height)
  }
  img.src = canvasDataUrl.value
}

/** 将当前画板内容保存到 store */
function saveCanvasToStore() {
  const canvas = canvasRef.value
  if (!canvas) return
  const dataUrl = canvas.toDataURL('image/png')
  hwStore.setCanvasData(dataUrl)
}

function getPos(e) {
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  if (e.touches && e.touches.length > 0) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    }
  }
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }
}

function startDraw(e) {
  e.preventDefault()
  isDrawing.value = true
  const pos = getPos(e)
  lastX.value = pos.x
  lastY.value = pos.y
  const c = ctx.value
  if (c) {
    c.beginPath()
    c.arc(pos.x, pos.y, penSize.value / 2, 0, Math.PI * 2)
    c.fillStyle = '#1a1a2e'
    c.fill()
  }
  hasContent.value = true
}

function draw(e) {
  const pos = getPos(e)
  cursorX.value = pos.x
  cursorY.value = pos.y
  if (!isDrawing.value) return
  e.preventDefault()
  const c = ctx.value
  if (!c) return
  c.beginPath()
  c.moveTo(lastX.value, lastY.value)
  const midX = (lastX.value + pos.x) / 2
  const midY = (lastY.value + pos.y) / 2
  c.quadraticCurveTo(lastX.value, lastY.value, midX, midY)
  c.stroke()
  lastX.value = pos.x
  lastY.value = pos.y
}

function onCanvasEnter(e) {
  cursorVisible.value = true
  const pos = getPos(e)
  cursorX.value = pos.x
  cursorY.value = pos.y
}

function onCanvasLeave() {
  cursorVisible.value = false
  isDrawing.value = false
}

function endDraw() {
  isDrawing.value = false
  saveCanvasToStore()
}

function clearCanvas() {
  const canvas = canvasRef.value
  const c = ctx.value
  if (!canvas || !c) return
  const rect = canvas.getBoundingClientRect()
  c.fillStyle = '#ffffff'
  c.fillRect(0, 0, rect.width, rect.height)
  hwStore.setCanvasData(null)
  hwStore.status = 'idle'
  hwStore.result = null
  hwStore.feedbackGiven = false
  hwStore.feedbackType = 0
  hwStore.errorMsg = null
  lowConfWarnedForId = null
}

// ============ 结果渲染 ============
const resultRenderRef = ref(null)

// 当前结果是否为化学模式
const isChemResult = computed(() => {
  const r = result.value
  if (!r) return false
  return (r.type || r.resultType) === 'chem'
})

function renderResult() {
  if (!result.value || !resultRenderRef.value) return
  const r = result.value
  const type = r.type || r.resultType || 'math'
  if (type === 'chem') {
    // SVG 走 v-html，无需 JS 渲染
    return
  }
  const latex = r.latex
  if (!latex) return
  try {
    katex.render(latex, resultRenderRef.value, {
      throwOnError: false,
      displayMode: true,
      errorColor: '#f87171',
    })
  } catch {
    resultRenderRef.value.textContent = latex
  }
}

// ============ 置信度提示 ============
const confidenceTips = [
  { min: 90, max: 100, level: 'high', text: '识别置信度较高，可以直接使用', color: '#34d399' },
  { min: 70, max: 90, level: 'medium', text: '识别结果可能不准确，建议核对公式内容', color: '#fbbf24' },
  { min: 50, max: 70, level: 'low', text: '识别置信度较低，请仔细核对或重新书写', color: '#f87171' },
  { min: 0, max: 50, level: 'veryLow', text: '识别失败或结果不可用，建议重新书写清晰公式', color: '#6b7280' },
]

const confidenceTip = computed(() => {
  if (result.value?.confidence == null) return { level: 'unknown', text: '无法获取置信度', color: '#6b7280' }
  const pct = result.value.confidence * 100
  const matched = confidenceTips.find(t => pct >= t.min && pct <= t.max)
  return matched || confidenceTips[confidenceTips.length - 1]
})

const confidencePercent = computed(() => {
  if (result.value?.confidence == null) return '--'
  return (result.value.confidence * 100).toFixed(1) + '%'
})

const statusText = computed(() => {
  switch (status.value) {
    case 'recognizing': return 'AI 正在识别手写内容，预计需要 3-10 秒'
    case 'success': return `识别完成！置信度 ${confidencePercent.value}`
    case 'error': return '识别失败，请重新书写或换一个公式'
    default: return ''
  }
})

// ============ Canvas 转 File（强制白底 + JPEG 格式，无透明通道，适配后端） ============
function canvasToFile() {
  return new Promise((resolve, reject) => {
    const srcCanvas = canvasRef.value
    if (!srcCanvas) {
      reject(new Error('画板未初始化'))
      return
    }
    const tmpCanvas = document.createElement('canvas')
    tmpCanvas.width = srcCanvas.width
    tmpCanvas.height = srcCanvas.height
    const tctx = tmpCanvas.getContext('2d')
    tctx.fillStyle = '#ffffff'
    tctx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height)
    tctx.drawImage(srcCanvas, 0, 0)
    try {
      tmpCanvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('画板转换失败'))
            return
          }
          const file = new File([blob], 'handwrite.jpg', { type: 'image/jpeg' })
          resolve(file)
        },
        'image/jpeg',
        0.95
      )
    } catch {
      reject(new Error('画板转换失败'))
    }
  })
}

// ============ 开始识别 ============
async function handleRecognize() {
  if (!hasContent.value) {
    ElMessage({ message: '请先在画板上书写公式', type: 'warning', duration: 2000, offset: 60 })
    return
  }
  saveCanvasToStore()
  const file = await canvasToFile()
  const data = await hwStore.startRecognize(file)
  if (data) {
    ElMessage({ message: '识别完成！', type: 'success', duration: 1500, offset: 60 })
    await nextTick()
    renderResult()
    if (result.value?.confidence != null && result.value.confidence < 0.70) {
      showLowConfidenceWarning()
    }
  }
}

// ============ 低置信度警告 ============
let lowConfWarnedForId = null
function showLowConfidenceWarning() {
  const id = result.value?.id
  if (id == null || lowConfWarnedForId === id) return
  lowConfWarnedForId = id
  const pct = (result.value.confidence * 100).toFixed(0)
  ElMessageBox.confirm(
    `当前置信度仅为 ${pct}%，请仔细核对识别出的公式内容。`,
    '识别结果可能不准确',
    { confirmButtonText: '使用此结果', cancelButtonText: '重新书写', type: 'warning' }
  ).then(() => {}).catch(() => {})
}

// ============ 复制结果 ============
async function copyResult() {
  if (!result.value) return
  // 化学模式复制 SMILES，数学模式复制 LaTeX
  const copyText = isChemResult.value
    ? (result.value.ssml || result.value.smiles || result.value.ssmlResult || '')
    : (result.value.latex || result.value.latexResult || '')
  if (!copyText) {
    ElMessage({ message: '没有可复制的内容', type: 'info', duration: 1500, offset: 60 })
    return
  }
  const label = isChemResult.value ? 'SMILES' : 'LaTeX 公式'
  function onSuccess() {
    ElMessage({ message: `${label} 已复制到剪贴板`, type: 'success', duration: 2000, offset: 60 })
  }
  function onFail() {
    ElMessage({ message: '复制失败，请手动复制', type: 'error', duration: 2000, offset: 60 })
  }
  // HTTP 内网穿透环境下 navigator.clipboard 可能不可用，兜底 execCommand
  function fallback(t) {
    try {
      const ta = document.createElement('textarea')
      ta.value = t
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch { return false }
  }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(copyText).then(onSuccess).catch(() => {
      fallback(copyText) ? onSuccess() : onFail()
    })
  } else {
    fallback(copyText) ? onSuccess() : onFail()
  }
}

// ============ 反馈 ============
async function markCorrect() {
  const ok = await hwStore.markFeedback(1)
  if (ok) {
    // store 已弹过 toast
  }
}

async function markIncorrect() {
  await hwStore.markFeedback(2)
}

// ============ 重置 ============
// resetAll：清空所有数据（画板+结果），仅在用户点"清空"时调用
function resetAll() {
  hwStore.reset()
  const canvas = canvasRef.value
  const c = ctx.value
  if (canvas && c) {
    const rect = canvas.getBoundingClientRect()
    c.fillStyle = '#ffffff'
    c.fillRect(0, 0, rect.width, rect.height)
  }
  lowConfWarnedForId = null
}

// ============ 生命周期 ============
let resizeObserver = null

onMounted(async () => {
  initCanvas()
  // 从 store 恢复画板内容
  if (canvasDataUrl.value) {
    await nextTick()
    restoreCanvas()
  }
  // 如果有识别结果，渲染 LaTeX
  if (result.value?.id != null) {
    await nextTick()
    renderResult()
  }
  // 监听容器尺寸变化，重新初始化画布
  resizeObserver = new ResizeObserver(() => {
    const canvas = canvasRef.value
    if (!canvas) return
    const tmp = document.createElement('canvas')
    tmp.width = canvas.width
    tmp.height = canvas.height
    tmp.getContext('2d').drawImage(canvas, 0, 0)
    initCanvas()
    const c = ctx.value
    if (c) {
      const rect = canvas.getBoundingClientRect()
      c.drawImage(tmp, 0, 0, rect.width, rect.height)
      saveCanvasToStore()
    }
  })
  if (canvasRef.value) {
    resizeObserver.observe(canvasRef.value.parentElement)
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  // 保存当前画板到 store（切页面前保留最后状态）
  saveCanvasToStore()
})

// 监听画笔大小变化
watch(penSize, (newSize) => {
  if (ctx.value) {
    ctx.value.lineWidth = newSize
  }
  hwStore.setPenSize(newSize)
})

// 监听识别成功后渲染 LaTeX
watch(
  () => result.value?.id,
  async (newId) => {
    if (newId != null && status.value === 'success') {
      await nextTick()
      renderResult()
    }
  }
)
</script>

<template>
  <div class="handwrite-page">
    <!-- 背景层 -->
    <div class="bg-gradient"></div>
    <div class="grid-overlay"></div>
    <div class="particles">
      <div
        v-for="i in 12"
        :key="i"
        class="particle"
        :style="{
          width: (Math.random() * 3 + 2) + 'px',
          height: (Math.random() * 3 + 2) + 'px',
          left: (Math.random() * 100) + '%',
          animationDuration: (Math.random() * 15 + 10) + 's',
          animationDelay: (Math.random() * 15) + 's',
          opacity: Math.random() * 0.25 + 0.1,
        }"
      ></div>
    </div>

    <!-- 主体 -->
    <main class="handwrite-main">
      <div class="handwrite-layout">
        <!-- 左侧：画板区 -->
        <div class="panel">
          <div class="panel-glow"></div>
          <div class="panel-header">
            <div class="panel-icon-wrap">
              <el-icon class="panel-icon"><EditPen /></el-icon>
            </div>
            <h2 class="panel-title">手写画板</h2>
          </div>

          <!-- 画板工具栏 -->
          <div class="canvas-toolbar">
            <div class="tool-group">
              <span class="tool-label">笔触</span>
              <div class="pen-sizes">
                <button
                  v-for="size in [2, 4, 6, 8]"
                  :key="size"
                  class="pen-size-btn"
                  :class="{ active: penSize === size }"
                  @click="penSize = size"
                >
                  <span class="pen-dot" :style="{ width: size + 'px', height: size + 'px' }"></span>
                </button>
              </div>
            </div>
            <button class="tool-btn clear-btn" @click="clearCanvas">
              <el-icon><Delete /></el-icon>
              <span>清空</span>
            </button>
          </div>

          <!-- 模式切换 -->
          <div class="mode-switch-wrap">
            <button
              class="mode-switch-btn"
              :class="{ 'is-chem': mode === 'chem' }"
              :disabled="status === 'recognizing'"
              @click="toggleMode"
              :title="mode === 'chem' ? '点击切换到数学公式' : '点击切换到化学公式'"
            >
              <el-icon class="mode-switch-icon"><Sort /></el-icon>
              <span class="mode-switch-label">当前:</span>
              <span class="mode-switch-current">{{ modeLabel }}</span>
            </button>
          </div>

          <!-- Canvas 画板 -->
          <div class="canvas-wrap">
            <canvas
              ref="canvasRef"
              class="draw-canvas"
              @mousedown="startDraw"
              @mousemove="draw"
              @mouseup="endDraw"
              @mouseenter="onCanvasEnter"
              @mouseleave="onCanvasLeave"
              @touchstart="startDraw"
              @touchmove="draw"
              @touchend="endDraw"
            ></canvas>
            <!-- 画笔光标指示器 -->
            <div
              v-show="cursorVisible"
              class="pen-cursor"
              :style="{
                left: cursorX + 'px',
                top: cursorY + 'px',
                width: penSize + 6 + 'px',
                height: penSize + 6 + 'px',
              }"
            ></div>
            <div v-if="!hasContent" class="canvas-hint">
              <el-icon class="hint-icon"><EditPen /></el-icon>
              <p class="hint-text">在此区域手写数学公式</p>
              <p class="hint-sub">支持鼠标 / 触摸屏书写</p>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="canvas-actions">
            <button
              class="btn btn-primary"
              :disabled="!hasContent || status === 'recognizing'"
              @click="handleRecognize"
            >
              <span v-if="status !== 'recognizing'">开始识别</span>
              <span v-else>识别中...</span>
            </button>
          </div>
        </div>

        <!-- 右侧：结果区 -->
        <div class="panel">
          <div class="panel-glow"></div>
          <div class="panel-header">
            <div class="panel-icon-wrap">
              <el-icon class="panel-icon"><DocumentCopy /></el-icon>
            </div>
            <h2 class="panel-title">识别结果</h2>
          </div>

          <!-- 空状态 -->
          <div v-if="status === 'idle'" class="result-empty">
            <div class="empty-icon-wrap">
              <el-icon class="empty-icon"><DocumentCopy /></el-icon>
            </div>
            <p class="empty-text">在画板上书写公式后点击识别</p>
          </div>

          <!-- 加载状态 -->
          <div v-if="status === 'recognizing'" class="result-loading">
            <div class="loading-spinner">
              <div class="spinner-ring"></div>
            </div>
            <p class="loading-text">{{ statusText }}</p>
          </div>

          <!-- 成功结果 -->
          <div v-if="status === 'success'" class="result-content">
            <!-- 置信度提示 -->
            <div class="confidence-bar" :class="confidenceTip.level">
              <div class="confidence-info">
                <span class="confidence-label" :style="{ color: confidenceTip.color }">
                  置信度：{{ confidencePercent }}
                </span>
                <span class="confidence-tip-text">{{ confidenceTip.text }}</span>
              </div>
              <div class="confidence-progress">
                <div
                  class="confidence-progress-fill"
                  :style="{
                    width: confidencePercent === '--' ? '0%' : confidencePercent,
                    backgroundColor: confidenceTip.color,
                  }"
                ></div>
              </div>
            </div>

            <!-- 结果渲染：math=KaTeX / chem=SVG -->
            <div class="latex-section">
              <div class="section-label" style="text-align:center;margin-bottom:12px">
                {{ isChemResult ? '化学结构图' : 'LaTeX 公式预览' }}
              </div>
              <!-- 化学模式：直接渲染 SVG 字符串（透明背景） -->
              <div
                v-if="isChemResult"
                class="chem-svg-render"
                v-html="result?.svg || result?.svgResult || ''"
              ></div>
              <!-- 数学模式：KaTeX 渲染 latex -->
              <div v-else ref="resultRenderRef" class="latex-render"></div>
            </div>

            <!-- 源码：math=LaTeX / chem=SMILES -->
            <div class="latex-source">
              <div class="source-header">
                <span class="source-label">{{ isChemResult ? 'SMILES 源码' : 'LaTeX 源码' }}</span>
                <button class="copy-btn" @click="copyResult">
                  <el-icon><DocumentCopy /></el-icon>
                  <span>复制</span>
                </button>
              </div>
              <pre class="latex-code">{{ isChemResult ? (result?.ssml || result?.smiles || result?.ssmlResult || '') : (result?.latex || result?.latexResult || '') }}</pre>
            </div>

            <!-- 反馈 -->
            <div class="feedback-section">
              <div class="feedback-label">
                {{ feedbackGiven ? '感谢您的反馈' : '这次识别结果是否正确？' }}
              </div>
              <div v-if="!feedbackGiven" class="feedback-actions">
                <button class="feedback-btn correct" @click="markCorrect">
                  <el-icon><Check /></el-icon>
                  <span>正确</span>
                </button>
                <button class="feedback-btn incorrect" @click="markIncorrect">
                  <el-icon><Close /></el-icon>
                  <span>错误</span>
                </button>
              </div>
              <div v-else class="feedback-done" :class="feedbackType === 1 ? 'correct' : 'incorrect'">
                <el-icon v-if="feedbackType === 1"><Check /></el-icon>
                <el-icon v-else><Close /></el-icon>
                <span>{{ feedbackType === 1 ? '已标记为正确，感谢反馈！' : '已标记为错误，我们将优化识别效果' }}</span>
              </div>
            </div>
          </div>

          <!-- 错误状态 -->
          <div v-if="status === 'error'" class="result-error">
            <div class="error-icon-wrap">
              <el-icon class="error-icon"><Close /></el-icon>
            </div>
            <p class="error-text">{{ statusText }}</p>
            <button class="btn btn-primary" @click="handleRecognize">重新识别</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ============ 全局背景层 ============ */
.handwrite-page {
  min-height: 100%;
  background: #0b0b14;
  position: relative;
  overflow-x: hidden;
}

.bg-gradient {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at 15% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 55%),
    radial-gradient(ellipse at 85% 80%, rgba(167, 139, 250, 0.1) 0%, transparent 55%),
    linear-gradient(180deg, #0a0a14 0%, #0e0e1c 50%, #0b0b14 100%);
  pointer-events: none;
  z-index: 0;
}

.grid-overlay {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(139, 92, 246, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(139, 92, 246, 0.02) 1px, transparent 1px);
  background-size: 80px 80px;
  pointer-events: none;
  z-index: 0;
}

.particles {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.particle {
  position: absolute;
  border-radius: 50%;
  background: rgba(167, 139, 250, 0.3);
  filter: blur(1px);
  animation: floatUp linear infinite;
}

@keyframes floatUp {
  0% { transform: translateY(100vh) scale(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-10vh) scale(1); opacity: 0; }
}

/* ============ 主体 ============ */
.handwrite-main {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}

.handwrite-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

/* ============ 面板通用 ============ */
.panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 28px;
  position: relative;
  overflow: hidden;
  animation: cardAppear 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(20px);
}

.panel:nth-child(2) {
  animation-delay: 0.15s;
}

@keyframes cardAppear {
  to { opacity: 1; transform: translateY(0); }
}

.panel-glow {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(167, 139, 250, 0.5), rgba(139, 92, 246, 0.5), transparent);
  border-radius: 2px;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.panel-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(139, 92, 246, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-icon {
  font-size: 18px;
  color: #a78bfa;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

/* ============ 画板工具栏 ============ */
.canvas-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tool-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

.pen-sizes {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pen-size-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.pen-size-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(167, 139, 250, 0.3);
}

.pen-size-btn.active {
  background: rgba(167, 139, 250, 0.12);
  border-color: rgba(167, 139, 250, 0.4);
}

.pen-dot {
  display: block;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
}

.tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.6);
  font-family: inherit;
}

.tool-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

/* ============ Canvas 画板 ============ */
.canvas-wrap {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #ffffff;
  width: 100%;
  height: 320px;
}

.draw-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: none;
  touch-action: none;
}

/* 画笔光标指示器 */
.pen-cursor {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(139, 92, 246, 0.8);
  background: rgba(139, 92, 246, 0.15);
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 2;
  transition: width 0.15s, height 0.15s;
}

.canvas-hint {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
}

.hint-icon {
  font-size: 48px;
  color: rgba(139, 92, 246, 0.15);
}

.hint-text {
  font-size: 16px;
  color: rgba(26, 26, 46, 0.3);
  font-weight: 500;
  margin: 0;
}

.hint-sub {
  font-size: 13px;
  color: rgba(26, 26, 46, 0.2);
  margin: 0;
}

/* ============ 画板操作按钮 ============ */
.canvas-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* ============ 模式切换按钮 ============ */
.mode-switch-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.mode-switch-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid rgba(139, 92, 246, 0.4);
  background: rgba(139, 92, 246, 0.08);
  color: #a78bfa;
  font-family: inherit;
  position: relative;
  overflow: hidden;
}

.mode-switch-btn:hover {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.6);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(139, 92, 246, 0.2);
}

.mode-switch-btn.is-chem {
  border-color: rgba(167, 139, 250, 0.45);
  background: rgba(167, 139, 250, 0.1);
  color: #c4b5fd;
}

.mode-switch-btn.is-chem:hover {
  background: rgba(167, 139, 250, 0.18);
  border-color: rgba(167, 139, 250, 0.65);
  box-shadow: 0 4px 14px rgba(167, 139, 250, 0.25);
}

.mode-switch-icon {
  font-size: 14px;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.mode-switch-btn:hover .mode-switch-icon {
  transform: rotate(180deg);
}

.mode-switch-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}

.mode-switch-current {
  font-weight: 600;
}

.mode-switch-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* ============ 按钮 ============ */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.7);
  font-family: inherit;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  border: none;
  color: #fff;
  position: relative;
  overflow: hidden;
  padding: 12px 40px;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

.btn-primary::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  transition: left 0.6s ease;
}

.btn-primary:hover::after {
  left: 100%;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* ============ 结果区 - 空状态 ============ */
.result-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  gap: 16px;
}

.empty-icon-wrap {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.empty-icon {
  font-size: 32px;
  color: rgba(255, 255, 255, 0.15);
}

.empty-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.3);
  margin: 0;
}

/* ============ 结果区 - 加载状态 ============ */
.result-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  gap: 24px;
}

.loading-spinner {
  width: 56px;
  height: 56px;
  position: relative;
}

.spinner-ring {
  width: 100%;
  height: 100%;
  border: 3px solid rgba(255, 255, 255, 0.06);
  border-top-color: #a78bfa;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

/* ============ 结果区 - 成功 ============ */
.result-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 置信度条 */
.confidence-bar {
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.02);
  position: relative;
  overflow: hidden;
}

.confidence-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  border-radius: 2px;
  opacity: 0.6;
}

.confidence-bar.high::before { background: linear-gradient(90deg, #10b981, #34d399); }
.confidence-bar.medium::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
.confidence-bar.low::before { background: linear-gradient(90deg, #ef4444, #f87171); }

.confidence-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
  flex-wrap: wrap;
  gap: 8px;
}

.confidence-label {
  font-size: 15px;
  font-weight: 600;
}

.confidence-tip-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

.confidence-progress {
  height: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.confidence-progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

/* LaTeX 渲染区 */
.latex-section {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 14px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  text-align: center;
}

.section-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 12px;
}

.latex-render {
  font-size: 20px;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-x: auto;
  color: #fff;
}

/* 化学结构图渲染区（SVG 透明背景，居中显示） */
.chem-svg-render {
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-x: auto;
  padding: 8px;
}

.chem-svg-render :deep(svg) {
  max-width: 100%;
  height: auto;
  display: block;
}

/* LaTeX 源码 */
.latex-source {
  background: #0f0f1a;
  border-radius: 14px;
  padding: 16px 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.source-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.source-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.5);
  font-family: inherit;
}

.copy-btn:hover {
  background: rgba(167, 139, 250, 0.1);
  border-color: rgba(167, 139, 250, 0.3);
  color: #a78bfa;
}

.latex-code {
  color: #a6accd;
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 反馈区 */
.feedback-section {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 14px;
  padding: 16px 20px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.feedback-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 12px;
}

.feedback-actions {
  display: flex;
  gap: 12px;
}

.feedback-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid;
  background: transparent;
  font-family: inherit;
}

.feedback-btn.correct {
  border-color: rgba(16, 185, 129, 0.3);
  color: #34d399;
}

.feedback-btn.correct:hover {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.5);
}

.feedback-btn.incorrect {
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.feedback-btn.incorrect:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.5);
}

.feedback-done {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.feedback-done.correct { color: #34d399; }
.feedback-done.incorrect { color: #f87171; }

/* ============ 结果区 - 错误 ============ */
.result-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  gap: 20px;
}

.error-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: rgba(239, 68, 68, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(239, 68, 68, 0.15);
}

.error-icon {
  font-size: 32px;
  color: #f87171;
}

.error-text {
  font-size: 15px;
  color: #f87171;
  margin: 0;
}

/* ============ 响应式 ============ */
@media (max-width: 900px) {
  .handwrite-layout { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .panel { padding: 20px 16px; border-radius: 16px; }
  .canvas-wrap { height: 260px; }
  .canvas-toolbar { flex-direction: column; gap: 10px; }
}
</style>
