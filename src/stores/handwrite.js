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
    },

    setCanvasData(dataUrl) {
      this.canvasDataUrl = dataUrl
      this.hasContent = !!dataUrl
    },

    setPenSize(size) {
      this.penSize = size
    },

    async startRecognize(file) {
      if (!file) {
        ElMessage.error({ message: '画板无内容', offset: 60, showClose: true })
        return null
      }

      this.status = 'recognizing'
      this.result = null
      this.feedbackGiven = false
      this.feedbackType = 0
      this.errorMsg = null

      try {
        const data = await recognizeUpload(file)
        if (data && data.latexResult != null && data.latex == null) {
          data.latex = data.latexResult
        }
        this.result = data || null
        this.status = 'success'
        return data
      } catch (err) {
        this.status = 'error'
        this.errorMsg = err?.message || '识别失败'
        return null
      }
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
