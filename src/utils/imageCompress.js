/**
 * 图片压缩工具：将大图片压缩到指定尺寸和质量，减少传输体积
 * 内网穿透带宽有限，原图可能 3-10MB，压缩后通常 < 200KB
 */

/**
 * 压缩图片文件
 * @param {File|Blob} file 原始图片文件
 * @param {Object} options 压缩选项
 * @param {number} options.maxWidth 最大宽度（默认 1280）
 * @param {number} options.maxHeight 最大高度（默认 1280）
 * @param {number} options.quality JPEG 质量 0-1（默认 0.85）
 * @returns {Promise<string>} Base64 字符串（不含 data:image/jpeg;base64, 前缀）
 */
export function compressImageToBase64(file, options = {}) {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.85,
  } = options

  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('文件为空'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // 计算缩放后的尺寸（保持宽高比）
        let { width, height } = img
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        // 创建离屏 canvas 绘制压缩后的图片
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ffffff' // 白底，避免透明通道问题
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        // 导出为 JPEG Base64
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        // 去掉 data:image/jpeg;base64, 前缀
        const base64 = dataUrl.split(',')[1]
        resolve(base64)
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}
