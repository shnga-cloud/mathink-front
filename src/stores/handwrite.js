import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import { recognizeUpload, submitFeedback } from '@/api/recognize'

/**
 * 手写识别 Store：跨路由保留手写内容与识别状态，避免用户切页面丢失进度
 * status: 'idle' | 'recognizing' | 'success' | 'error'
 */
export const useHandwriteStore = defineStore('handwrite', {
  state: () => ({
    status: 'idle',
    canvasDataUrl: null,   // 画板内容 base64（切换路由时恢复画板）
    hasContent: false,     // 画板上是否有内容
    penSize: 4,            // 笔触大小
    result: null,          // 识别结果
    feedbackGiven: false,
    feedbackType: 0,       // 0 未反馈，1 正确，2 错误
    errorMsg: null,
    mode: 'math',          // 识别模式：'math' | 'chem'，默认数学公式
    reqSeq: 0,             // 请求代数计数器：中断后递增，旧响应回来直接丢弃
  }),

  actions: {
    reset() {
      this.status = 'idle'
      this.canvasDataUrl = null
      this.hasContent = false
      this.penSize = 4
      this.result = null
      this.feedbackGiven = false
      this.feedbackType = 0
      this.errorMsg = null
      // 注意：mode 不重置，保留用户上次选择
    },

    setCanvasData(dataUrl) {
      this.canvasDataUrl = dataUrl
      this.hasContent = !!dataUrl
    },

    setPenSize(size) {
      this.penSize = size
    },

    setMode(mode) {
      if (mode === 'math' || mode === 'chem') {
        this.mode = mode
      }
    },

    async startRecognize(file, mode) {
      if (!file) {
        ElMessage.error({ message: '画板无内容', offset: 60, showClose: true })
        return null
      }
      const useMode = mode || this.mode || 'math'
      if (mode) this.mode = mode

      // 记录本次请求代数，用于丢弃中断/新请求后返回的旧响应
      const seq = ++this.reqSeq

      this.status = 'recognizing'
      this.result = null
      this.feedbackGiven = false
      this.feedbackType = 0
      this.errorMsg = null

      try {
        const data = await recognizeUpload(file, useMode)
        // 已被中断或发起了新请求：丢弃旧响应，不写回任何状态
        if (seq !== this.reqSeq) return null
        // 后端数学模式返回 latexResult / latex 统一映射
        if (data && data.latexResult != null && data.latex == null) {
          data.latex = data.latexResult
        }
        this.result = data || null
        this.status = 'success'
        return data
      } catch (err) {
        if (seq !== this.reqSeq) return null
        this.status = 'error'
        this.errorMsg = err?.message || '识别失败'
        return null
      }
    },

    /**
     * 中断识别：不真正取消 HTTP 请求（后端继续跑，前端不管了），
     * 只是把页面回到"未发起请求之前"的状态，旧响应回来会被丢弃。
     * 保留画板内容（canvasDataUrl / hasContent / penSize）和模式，用户可直接修改后重新识别。
     */
    abortRecognize() {
      this.reqSeq++          // 使进行中的请求失效
      this.status = 'idle'
      this.result = null
      this.feedbackGiven = false
      this.feedbackType = 0
      this.errorMsg = null
    },

    async markFeedback(type) {
      if (!this.result || !this.result.id) return false
      try {
        await submitFeedback(this.result.id, type)
        this.feedbackGiven = true
        this.feedbackType = type
        ElMessage.success({
          message: type === 1 ? '已标记为正确，感谢反馈！' : '已标记为错误，我们将优化识别效果',
          offset: 60,
          showClose: true,
        })
        return true
      } catch {
        return false
      }
    },
  },
})
