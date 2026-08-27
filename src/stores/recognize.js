import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import { recognizeUpload, submitFeedback } from '@/api/recognize'

/**
 * 识别会话 Store：跨路由保留识别中状态，避免用户切页面丢失进度
 * status: 'idle' | 'uploading' | 'recognizing' | 'success' | 'error'
 */
export const useRecognizeStore = defineStore('recognize', {
  state: () => ({
    status: 'idle',
    selectedFile: null,      // File 对象（仅用于再次点击识别时可选；切换路由后 File 对象可能丢失，主要靠 previewUrl + result）
    previewUrl: null,        // 图片预览 URL（ObjectURL，切路由不会自动销毁）
    result: null,            // { id, type, latex, svg, ssml, confidence, imageUrl, ... }
    feedbackGiven: false,    // 是否已反馈
    feedbackType: 0,         // 0 未反馈，1 正确，2 错误
    errorMsg: null,          // 错误信息
    pendingAutoRecognize: false, // 从历史记录跳转过来时自动触发识别的标志
    mode: 'math',            // 识别模式：'math' | 'chem'，默认数学公式
  }),

  actions: {
    /** 重置会话（点击重新选择/刷新前调用） */
    reset() {
      // 清理上一张预览 URL，释放内存
      if (this.previewUrl && /^blob:/.test(this.previewUrl)) {
        try { URL.revokeObjectURL(this.previewUrl) } catch {}
      }
      this.status = 'idle'
      this.selectedFile = null
      this.previewUrl = null
      this.result = null
      this.feedbackGiven = false
      this.feedbackType = 0
      this.errorMsg = null
      this.pendingAutoRecognize = false
      // 注意：mode 不重置，保留用户上次选择，避免重新选择图片后模式被清掉
    },

    /** 设置识别模式 */
    setMode(mode) {
      if (mode === 'math' || mode === 'chem') {
        this.mode = mode
      }
    },

    /** 设置文件并生成预览（调用 startRecognize 前使用） */
    setFile(file) {
      this.selectedFile = file
      if (this.previewUrl && /^blob:/.test(this.previewUrl)) {
        try { URL.revokeObjectURL(this.previewUrl) } catch {}
      }
      if (file) {
        this.previewUrl = URL.createObjectURL(file)
      } else {
        this.previewUrl = null
      }
    },

    /**
     * 发起识别（Promise 挂在 store 上，组件卸载也不影响结果写回）
     * @param {File} [file] 可选，不传则使用 state.selectedFile
     * @param {string} [mode] 可选，不传则使用 state.mode
     */
    async startRecognize(file, mode) {
      const useFile = file || this.selectedFile
      if (!useFile) {
        ElMessage.error({ message: '请先选择图片', offset: 60, showClose: true })
        return null
      }
      const useMode = mode || this.mode || 'math'
      if (file) this.setFile(file)
      if (mode) this.mode = mode

      this.status = 'uploading'
      this.result = null
      this.feedbackGiven = false
      this.feedbackType = 0
      this.errorMsg = null

      try {
        this.status = 'recognizing'
        const data = await recognizeUpload(useFile, useMode)
        // 后端数学模式返回 latexResult / latex 统一映射
        if (data && data.latexResult != null && data.latex == null) {
          data.latex = data.latexResult
        }
        this.result = data || null
        this.status = 'success'
        return data
      } catch (err) {
        // request 拦截器已经 toast 过错误
        this.status = 'error'
        this.errorMsg = err?.message || '识别失败'
        return null
      }
    },

    /** 反馈识别结果正确性 */
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
