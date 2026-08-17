<script setup>
import { ref, computed, onMounted, watch, nextTick, toRefs } from 'vue'
import { useRecognizeStore } from '@/stores/recognize'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, DocumentCopy, Check, Close, Refresh, Picture, ArrowDown } from '@element-plus/icons-vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const recStore = useRecognizeStore()
const { status, selectedFile, previewUrl, result, feedbackGiven, feedbackType } = toRefs(recStore)

// ============ 置信度提示逻辑 ============
const confidenceTips = [
  { min: 90, max: 100, level: 'high', text: '识别置信度较高，可以直接使用', color: '#34d399' },
  { min: 70, max: 90, level: 'medium', text: '识别结果可能不准确，建议核对公式内容', color: '#fbbf24' },
  { min: 50, max: 70, level: 'low', text: '识别置信度较低，请仔细核对或重新识别', color: '#f87171' },
  { min: 0, max: 50, level: 'veryLow', text: '识别失败或结果不可用，建议重新上传清晰图片', color: '#6b7280' },
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
    case 'uploading': return '正在上传图片...'
    case 'recognizing': return 'AI 正在识别公式，预计需要 3-10 秒'
    case 'success': return `识别完成！置信度 ${confidencePercent.value}`
    case 'error': return '识别失败，请重新上传或换一张图片'
    default: return ''
  }
})

// ============ 文件校验 ============
const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const maxSize = 5 * 1024 * 1024

function validateFile(file) {
  if (!allowedTypes.includes(file.type)) {
    ElMessage({ message: '仅支持 PNG / JPG / JPEG / WEBP 格式', type: 'error', duration: 3000, offset: 60, showClose: true })
    return false
  }
  if (file.size > maxSize) {
    ElMessage({ message: '图片大小不能超过 5MB，请压缩后重新上传', type: 'error', duration: 3000, offset: 60, showClose: true })
    return false
  }
  return true
}

// ============ 文件选择 ============
const fileInputRef = ref(null)
const isDragOver = ref(false)

function handleFileSelect(file) {
  if (!file) return
  if (!validateFile(file)) return
  recStore.setFile(file)
}

function onFileChange(e) {
  const file = e.target.files[0]
  handleFileSelect(file)
  e.target.value = ''
}

function onDrop(e) {
  isDragOver.value = false
  const file = e.dataTransfer.files[0]
  handleFileSelect(file)
}

function onDragOver() { isDragOver.value = true }
function onDragLeave() { isDragOver.value = false }
function triggerFileInput() { fileInputRef.value?.click() }

// ============ 识别流程 ============
const treatedResultIds = new Set()

async function handleRecognize() {
  if (!selectedFile.value) return
  if (result.value?.id != null) treatedResultIds.delete(result.value.id)
  await recStore.startRecognize()
}

// ============ KaTeX 渲染 ============
const latexRenderRef = ref(null)

function renderLatex() {
  const latex = result.value?.latex
  if (!latex || !latexRenderRef.value) return
  try {
    katex.render(latex, latexRenderRef.value, {
      throwOnError: false,
      displayMode: true,
      errorColor: '#f87171',
    })
  } catch {
    latexRenderRef.value.textContent = latex
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
    '⚠️ 识别结果可能不准确',
    { confirmButtonText: '使用此结果', cancelButtonText: '重新识别', type: 'warning' }
  ).then(() => {}).catch(() => { resetAll() })
}

// ============ 复制 LaTeX ============
async function copyLatex() {
  const latex = result.value?.latex
  if (!latex) return
  try {
    await navigator.clipboard.writeText(latex)
    ElMessage({ message: 'LaTeX 公式已复制到剪贴板', type: 'success', duration: 2000, offset: 60, showClose: true })
  } catch {
    ElMessage({ message: '复制失败，请手动复制', type: 'error', duration: 2000, offset: 60, showClose: true })
  }
}

// ============ 反馈 ============
async function markCorrect() { await recStore.markFeedback(1) }
async function markIncorrect() { await recStore.markFeedback(2) }

// ============ 重置 ============
function resetResult() {
  if (!result.value) return
  result.value = { id: null, latex: '', confidence: null, imageUrl: '' }
  feedbackGiven.value = false
}

function resetAll() {
  recStore.reset()
  lowConfWarnedForId = null
}

// ============ 挂载 & watch ============
let lastStatus = status.value
let historyToastForId = null

onMounted(() => {
  lastStatus = status.value
  if (status.value === 'success' && result.value?.latex) {
    nextTick(() => renderLatex())
  }
})

watch(
  () => [status.value, result.value?.id],
  async ([newStatus, newId]) => {
    const prev = lastStatus
    lastStatus = newStatus
    if (newStatus === 'success' && prev !== 'success' && newId != null) {
      if (!treatedResultIds.has(newId)) {
        treatedResultIds.add(newId)
        ElMessage({ message: '识别完成！', type: 'success', duration: 1500, offset: 60, showClose: true })
        await nextTick()
        renderLatex()
        if (result.value?.confidence != null && result.value.confidence < 0.70) {
          showLowConfidenceWarning()
        }
        if (historyToastForId !== newId) {
          historyToastForId = newId
          setTimeout(() => {
            ElMessage({ message: '已保存到历史记录', type: 'info', duration: 2000, offset: 60, showClose: true })
          }, 1600)
        }
      } else {
        await nextTick()
        renderLatex()
      }
    }
  },
  { immediate: false }
)
</script>

<template>
  <div class="recognize-page">
    <!-- 背景层 -->
    <div class="bg-gradient"></div>
    <div class="grid-overlay"></div>
    <div class="particles">
      <div
        v-for="i in 15"
        :key="i"
        class="particle"
        :style="{
          width: (Math.random() * 4 + 2) + 'px',
          height: (Math.random() * 4 + 2) + 'px',
          left: (Math.random() * 100) + '%',
          animationDuration: (Math.random() * 15 + 10) + 's',
          animationDelay: (Math.random() * 15) + 's',
          opacity: Math.random() * 0.3 + 0.1,
        }"
      ></div>
    </div>

    <!-- 主体 -->
    <main class="recognize-main">
      <div class="recognize-layout">
        <!-- 左侧：上传区 -->
        <div class="panel">
          <div class="panel-glow"></div>
          <div class="panel-header">
            <div class="panel-icon-wrap">
              <el-icon class="panel-icon"><Picture /></el-icon>
            </div>
            <h2 class="panel-title">图片上传</h2>
          </div>

          <input
            ref="fileInputRef"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            style="display: none"
            @change="onFileChange"
          />

          <!-- 上传区域 -->
          <div
            v-if="!previewUrl"
            class="upload-zone"
            :class="{ 'drag-over': isDragOver }"
            @click="triggerFileInput"
            @drop.prevent="onDrop"
            @dragover.prevent="onDragOver"
            @dragleave.prevent="onDragLeave"
          >
            <div class="upload-icon-wrap">
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
            </div>
            <p class="upload-text">拖拽图片到此处，或点击选择文件</p>
            <p class="upload-hint">支持 PNG、JPG、JPEG、WEBP，单张不超过 5MB</p>
            <p class="upload-tip">建议在光线充足的环境下拍摄，手写公式清晰可辨</p>
          </div>

          <!-- 预览区域 -->
          <div v-else class="preview-zone">
            <div class="preview-image-wrap">
              <img :src="previewUrl" class="preview-image" alt="预览图" />
            </div>
            <div class="preview-actions">
              <button class="btn" @click="resetAll" :disabled="status === 'uploading' || status === 'recognizing'">
                <el-icon><Refresh /></el-icon>
                <span>重新选择</span>
              </button>
              <button
                class="btn btn-primary"
                :disabled="status === 'uploading' || status === 'recognizing'"
                @click="handleRecognize"
              >
                <span v-if="status === 'idle' || status === 'success' || status === 'error'">开始识别</span>
                <span v-else>识别中...</span>
              </button>
            </div>
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
            <p class="empty-text">上传图片后将显示识别结果</p>
          </div>

          <!-- 加载状态 -->
          <div v-if="status === 'uploading' || status === 'recognizing'" class="result-loading">
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

            <!-- LaTeX 渲染 -->
            <div class="latex-section">
              <div class="section-label" style="text-align:center;margin-bottom:12px">LaTeX 公式预览</div>
              <div ref="latexRenderRef" class="latex-render"></div>
            </div>

            <!-- LaTeX 源码 -->
            <div class="latex-source">
              <div class="source-header">
                <span class="source-label">LaTeX 源码</span>
                <button class="copy-btn" @click="copyLatex">
                  <el-icon><DocumentCopy /></el-icon>
                  <span>复制</span>
                </button>
              </div>
              <pre class="latex-code">{{ result?.latex }}</pre>
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
            <button class="btn btn-primary" @click="resetAll">重新上传</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ============ 全局背景层 ============ */
.recognize-page {
  min-height: 100%;
  background: #0b0b14;
  position: relative;
  overflow-x: hidden;
}

.bg-gradient {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at 15% 20%, rgba(102, 126, 234, 0.15) 0%, transparent 55%),
    radial-gradient(ellipse at 85% 80%, rgba(118, 75, 162, 0.1) 0%, transparent 55%),
    linear-gradient(180deg, #0a0a14 0%, #0e0e1c 50%, #0b0b14 100%);
  pointer-events: none;
  z-index: 0;
}

.grid-overlay {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(102, 126, 234, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(102, 126, 234, 0.02) 1px, transparent 1px);
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
  background: rgba(102, 126, 234, 0.3);
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
.recognize-main {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}

.recognize-layout {
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
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.5), rgba(167, 139, 250, 0.5), transparent);
  border-radius: 2px;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.panel-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(102, 126, 234, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-icon {
  font-size: 18px;
  color: #818cf8;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

/* ============ 上传区域 ============ */
.upload-zone {
  border: 2px dashed rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 56px 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  min-height: 360px;
  justify-content: center;
  background: rgba(255, 255, 255, 0.015);
  position: relative;
  overflow: hidden;
}

.upload-zone:hover,
.upload-zone.drag-over {
  border-color: rgba(102, 126, 234, 0.5);
  background: rgba(102, 126, 234, 0.04);
  box-shadow: 0 0 40px rgba(102, 126, 234, 0.08);
}

.upload-zone::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(102, 126, 234, 0.06) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.4s;
}

.upload-zone:hover::before,
.upload-zone.drag-over::before {
  opacity: 1;
}

.upload-icon-wrap {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: rgba(102, 126, 234, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  transition: all 0.4s;
  position: relative;
  z-index: 1;
}

.upload-zone:hover .upload-icon-wrap,
.upload-zone.drag-over .upload-icon-wrap {
  background: rgba(102, 126, 234, 0.15);
  transform: scale(1.05);
}

.upload-icon {
  font-size: 36px;
  color: rgba(102, 126, 234, 0.6);
  transition: color 0.4s;
}

.upload-zone:hover .upload-icon,
.upload-zone.drag-over .upload-icon {
  color: #818cf8;
}

.upload-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  margin: 0;
  position: relative;
  z-index: 1;
}

.upload-hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.35);
  margin: 0;
  position: relative;
  z-index: 1;
}

.upload-tip {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.2);
  margin: 4px 0 0 0;
  position: relative;
  z-index: 1;
}

/* ============ 预览区域 ============ */
.preview-zone {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.preview-image-wrap {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  position: relative;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
}

.preview-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #fff;
  position: relative;
  overflow: hidden;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
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
  border-top-color: #667eea;
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
  background: rgba(102, 126, 234, 0.1);
  border-color: rgba(102, 126, 234, 0.3);
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
  .recognize-layout { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .panel { padding: 20px 16px; border-radius: 16px; }
  .upload-zone { padding: 36px 20px; min-height: 280px; }
}
</style>