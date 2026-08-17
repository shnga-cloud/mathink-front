<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElImageViewer } from 'element-plus'
import {
  DocumentCopy, Check, Close, Picture, RefreshRight,
  DataLine, ArrowLeft, ArrowRight
} from '@element-plus/icons-vue'
import { getHistoryList, submitFeedback } from '@/api/recognize'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const router = useRouter()

// ============ 列表数据 ============
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const list = ref([])

const FEEDBACK_TYPE = {
  NONE: 0,
  CORRECT: 1,
  WRONG: 2,
}

// ============ 图片预览 ============
const imageViewerVisible = ref(false)
const imageViewerUrl = ref('')

function previewImage(url) {
  if (!url) return
  imageViewerUrl.value = url
  imageViewerVisible.value = true
}

// ============ LaTeX 预渲染 ============
function renderLatexToString(latex) {
  if (!latex) return ''
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode: false,
      errorColor: '#f87171',
    })
  } catch {
    return latex
  }
}

// ============ 加载历史 ============
async function loadList() {
  loading.value = true
  try {
    const data = await getHistoryList(pageNum.value, pageSize.value)
    if (!data) {
      list.value = []
      total.value = 0
      return
    }
    if (Array.isArray(data)) {
      list.value = data.map((item) => {
        const raw = item.latexResult ?? item.latex ?? ''
        return { ...item, latex: raw, latexHtml: renderLatexToString(raw) }
      })
      total.value = data.length
    } else if (data.list != null) {
      list.value = (data.list || []).map((item) => {
        const raw = item.latexResult ?? item.latex ?? ''
        return { ...item, latex: raw, latexHtml: renderLatexToString(raw) }
      })
      total.value = data.total ?? list.value.length
    } else {
      list.value = []
      total.value = 0
    }
  } catch (e) {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// ============ 置信度提示 ============
function getConfidenceInfo(confidence) {
  if (confidence == null) return { level: 'unknown', text: '未知', color: '#6b7280', pct: '--' }
  const pct = confidence * 100
  if (pct >= 90) return { level: 'high', text: '高', color: '#34d399', pct: pct.toFixed(1) + '%' }
  if (pct >= 70) return { level: 'medium', text: '中', color: '#fbbf24', pct: pct.toFixed(1) + '%' }
  if (pct >= 50) return { level: 'low', text: '低', color: '#f87171', pct: pct.toFixed(1) + '%' }
  return { level: 'veryLow', text: '极低', color: '#ef4444', pct: pct.toFixed(1) + '%' }
}

// ============ 反馈 ============
const submittingFeedback = ref(new Set())

function isFeedbackSubmitting(id) {
  return submittingFeedback.value.has(id)
}

async function handleFeedback(item, fb) {
  if (item.feedback === fb) return
  try {
    submittingFeedback.value.add(item.id)
    await submitFeedback(item.id, fb)
    item.feedback = fb
    ElMessage({
      message: fb === FEEDBACK_TYPE.CORRECT ? '已标记为正确' : '已标记为错误',
      type: fb === FEEDBACK_TYPE.CORRECT ? 'success' : 'info',
      duration: 1500,
      offset: 60,
    })
  } finally {
    submittingFeedback.value.delete(item.id)
  }
}

// ============ 复制 LaTeX ============
async function copyLatex(latex) {
  try {
    await navigator.clipboard.writeText(latex)
    ElMessage({ message: 'LaTeX 已复制到剪贴板', type: 'success', duration: 1500, offset: 60 })
  } catch {
    ElMessage({ message: '复制失败，请手动复制', type: 'error', duration: 1500, offset: 60 })
  }
}

// ============ 时间格式化 ============
function formatTime(t) {
  if (!t) return '-'
  const normalized = String(t).replace(/-/g, '/').replace('T', ' ')
  const d = new Date(normalized)
  if (Number.isNaN(d.getTime())) return String(t).replace('T', ' ')
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ============ 分页 ============
function onPageChange(p) {
  pageNum.value = p
  loadList()
}
function onPageSizeChange(s) {
  pageSize.value = s
  pageNum.value = 1
  loadList()
}

// ============ 分页计算 ============
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
const pageNumbers = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, pageNum.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

// ============ 生命周期 ============
onMounted(() => {
  loadList()
})
</script>

<template>
  <div class="history-page">
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
    <main class="history-main">
      <!-- 顶部操作栏 -->
      <div class="top-bar">
        <div class="bar-left">
          <span class="stat-tag">
            <el-icon style="margin-right: 4px"><DataLine /></el-icon>
            共 {{ total }} 条记录
          </span>
        </div>
        <div class="bar-right">
          <button class="refresh-btn" @click="loadList" :disabled="loading">
            <el-icon><RefreshRight /></el-icon>
            <span>刷新</span>
          </button>
        </div>
      </div>

      <!-- 表格卡片 -->
      <div class="table-card" v-loading="loading" element-loading-background="rgba(11,11,20,0.8)">
        <div class="card-glow"></div>

        <!-- 有数据 -->
        <template v-if="list.length > 0">
          <table class="history-table">
            <thead>
              <tr>
                <th style="width:120px;text-align:center">原图</th>
                <th style="width:180px;text-align:center">公式预览</th>
                <th style="width:90px">LaTeX 源码</th>
                <th style="width:110px;text-align:center">置信度</th>
                <th style="width:180px;text-align:center">反馈状态</th>
                <th style="width:150px;text-align:center">识别时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in list" :key="item.id">
                <!-- 缩略图 -->
                <td style="text-align:center">
                  <div v-if="item.imageUrl" class="thumb-wrap" @click="previewImage(item.imageUrl)">
                    <img :src="item.imageUrl" class="thumb" alt="原图" />
                    <div class="thumb-mask">
                      <el-icon><Picture /></el-icon>
                      <span>查看</span>
                    </div>
                  </div>
                  <span v-else class="placeholder">-</span>
                </td>

                <!-- LaTeX 渲染 -->
                <td style="text-align:center">
                  <div
                    v-if="item.latexHtml"
                    class="latex-cell"
                    v-html="item.latexHtml"
                  ></div>
                  <span v-else class="placeholder">-</span>
                </td>

                <!-- LaTeX 源码 -->
                <td>
                  <div v-if="item.latex" class="latex-source-wrap">
                    <code class="latex-source" :title="item.latex">{{ item.latex }}</code>
                    <button class="copy-btn" @click="copyLatex(item.latex)">
                      <el-icon><DocumentCopy /></el-icon>
                      <span>复制</span>
                    </button>
                  </div>
                  <span v-else class="placeholder">-</span>
                </td>

                <!-- 置信度 -->
                <td style="text-align:center">
                  <div class="confidence-cell">
                    <span
                      class="confidence-tag"
                      :style="{ color: getConfidenceInfo(item.confidence).color, borderColor: getConfidenceInfo(item.confidence).color }"
                    >
                      {{ getConfidenceInfo(item.confidence).pct }}
                    </span>
                    <div class="confidence-level">{{ getConfidenceInfo(item.confidence).text }}</div>
                  </div>
                </td>

                <!-- 反馈 -->
                <td style="text-align:center">
                  <div v-if="!item.feedback || item.feedback === 0" class="feedback-actions-cell">
                    <button
                      class="fb-btn correct"
                      :disabled="isFeedbackSubmitting(item.id)"
                      @click="handleFeedback(item, 1)"
                    >
                      <el-icon><Check /></el-icon>
                      <span>正确</span>
                    </button>
                    <button
                      class="fb-btn incorrect"
                      :disabled="isFeedbackSubmitting(item.id)"
                      @click="handleFeedback(item, 2)"
                    >
                      <el-icon><Close /></el-icon>
                      <span>错误</span>
                    </button>
                  </div>
                  <span v-else-if="item.feedback === 1" class="fb-tag correct">
                    <el-icon><Check /></el-icon>
                    已标记正确
                  </span>
                  <span v-else-if="item.feedback === 2" class="fb-tag incorrect">
                    <el-icon><Close /></el-icon>
                    已标记错误
                  </span>
                  <span v-else class="placeholder">-</span>
                </td>

                <!-- 时间 -->
                <td style="text-align:center">
                  <span class="time-cell">{{ formatTime(item.createdAt || item.createTime || item.time) }}</span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 分页 -->
          <div class="pagination-wrap">
            <button
              class="page-btn"
              :disabled="pageNum <= 1"
              @click="onPageChange(pageNum - 1)"
            >
              <el-icon><ArrowLeft /></el-icon>
            </button>
            <button
              v-for="p in pageNumbers"
              :key="p"
              class="page-btn"
              :class="{ active: p === pageNum }"
              @click="onPageChange(p)"
            >
              {{ p }}
            </button>
            <button
              class="page-btn"
              :disabled="pageNum >= totalPages"
              @click="onPageChange(pageNum + 1)"
            >
              <el-icon><ArrowRight /></el-icon>
            </button>
            <span class="page-info">共 {{ totalPages }} 页</span>
          </div>
        </template>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <div class="empty-icon-wrap">
            <el-icon class="empty-icon"><DocumentCopy /></el-icon>
          </div>
          <p class="empty-text">暂无识别历史记录</p>
        </div>
      </div>
    </main>

    <!-- 图片查看器 -->
    <el-image-viewer
      v-if="imageViewerVisible"
      :url-list="[imageViewerUrl]"
      :initial-index="0"
      :z-index="3000"
      hide-on-click-modal
      @close="imageViewerVisible = false"
    />
  </div>
</template>

<style scoped>
/* ============ 全局背景层 ============ */
.history-page {
  min-height: 100%;
  background: #0b0b14;
  position: relative;
  overflow-x: hidden;
}

.bg-gradient {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at 15% 20%, rgba(102, 126, 234, 0.12) 0%, transparent 55%),
    radial-gradient(ellipse at 85% 80%, rgba(118, 75, 162, 0.08) 0%, transparent 55%),
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
  background: rgba(102, 126, 234, 0.25);
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
.history-main {
  position: relative;
  z-index: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 28px 24px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ============ 顶部操作栏 ============ */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  animation: cardAppear 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(16px);
}

@keyframes cardAppear {
  to { opacity: 1; transform: translateY(0); }
}

.stat-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.6);
  font-family: inherit;
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(102, 126, 234, 0.3);
  color: #a78bfa;
}

.refresh-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ============ 表格卡片 ============ */
.table-card {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  animation: cardAppear 0.6s 0.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
  transform: translateY(16px);
}

.card-glow {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.4), rgba(167, 139, 250, 0.4), transparent);
  border-radius: 2px;
}

/* ============ 自定义表格 ============ */
.history-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 13px;
}

.history-table thead th {
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: transparent;
}

.history-table tbody tr {
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  transition: background 0.2s;
}

.history-table tbody tr:hover {
  background: rgba(102, 126, 234, 0.03);
}

.history-table tbody td {
  padding: 16px;
  vertical-align: middle;
  color: rgba(255, 255, 255, 0.7);
}

.placeholder {
  color: rgba(255, 255, 255, 0.2);
  font-size: 13px;
}

/* ============ 缩略图 ============ */
.thumb-wrap {
  width: 90px;
  height: 64px;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  cursor: zoom-in;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  margin: 0 auto;
}

.thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 11px;
  opacity: 0;
  transition: opacity 0.3s;
  gap: 2px;
}

.thumb-wrap:hover .thumb-mask {
  opacity: 1;
}

/* ============ LaTeX 渲染 ============ */
.latex-cell {
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  font-size: 15px;
  padding: 6px 8px;
  color: #fff;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.4;
}

.latex-cell :deep(.katex) {
  display: inline-block;
  max-width: 100%;
  font-size: 1em;
  overflow: visible;
}

/* ============ 源码 ============ */
.latex-source-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.latex-source {
  flex: 1;
  min-width: 0;
  display: inline-block;
  padding: 6px 12px;
  background: #0f0f1a;
  color: #a6accd;
  border-radius: 8px;
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
  font-family: inherit;
}

.copy-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  border-color: rgba(102, 126, 234, 0.3);
  color: #a78bfa;
}

.copy-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ============ 置信度 ============ */
.confidence-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.confidence-tag {
  display: inline-block;
  padding: 3px 12px;
  border: 1px solid;
  border-radius: 20px;
  font-weight: 600;
  font-size: 12px;
  background: transparent;
}

.confidence-level {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
}

/* ============ 反馈 ============ */
.feedback-actions-cell {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.fb-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid;
  background: transparent;
  font-family: inherit;
}

.fb-btn.correct {
  border-color: rgba(16, 185, 129, 0.3);
  color: #34d399;
}

.fb-btn.correct:hover {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.5);
}

.fb-btn.incorrect {
  border-color: rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.fb-btn.incorrect:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.5);
}

.fb-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.fb-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.fb-tag.correct {
  background: rgba(16, 185, 129, 0.1);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.fb-tag.incorrect {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* ============ 时间 ============ */
.time-cell {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
  font-variant-numeric: tabular-nums;
}

/* ============ 分页 ============ */
.pagination-wrap {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 6px;
}

.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.5);
  font-family: inherit;
}

.page-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(102, 126, 234, 0.3);
  color: #a78bfa;
}

.page-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: #fff;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-info {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  margin-left: 8px;
}

/* ============ 空状态 ============ */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
}

.empty-icon-wrap {
  width: 72px;
  height: 72px;
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
}

/* ============ 响应式 ============ */
@media (max-width: 1100px) {
  .history-table thead th:nth-child(3),
  .history-table tbody td:nth-child(3) {
    display: none;
  }
}
@media (max-width: 900px) {
  .top-bar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  .history-table {
    font-size: 12px;
  }
  .history-table tbody td {
    padding: 12px 8px;
  }
  .thumb-wrap {
    width: 70px;
    height: 50px;
  }
}
@media (max-width: 768px) {
  .history-table thead th:nth-child(4),
  .history-table tbody td:nth-child(4) {
    display: none;
  }
}

/* ============ ElImageViewer 关闭按钮优化 ============ */
:deep(.el-image-viewer__wrapper) {
  .el-image-viewer__btn {
    opacity: 1;
  }
  .el-image-viewer__close {
    font-size: 32px;
    color: #fff;
    background-color: rgba(0, 0, 0, 0.55);
    width: 48px;
    height: 48px;
    border-radius: 50%;
    top: 24px;
    right: 24px;
  }
  .el-image-viewer__close:hover {
    background-color: rgba(0, 0, 0, 0.75);
  }
}
</style>