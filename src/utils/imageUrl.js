/**
 * 图片 URL 解析工具
 * 后端返回的 imageUrl 可能是相对路径（如 /uploads/xxx.jpg），
 * 也可能是完整 URL。需要统一处理为可访问的完整地址。
 */

// 从 request.js 导出的 baseURL 中提取后端服务器地址
// 默认使用 localhost:8080
let _backendBase = 'http://localhost:8080'

/**
 * 设置后端基础地址（供启动时从 request 配置中读取）
 */
export function setBackendBase(url) {
  if (url) {
    // 去掉末尾的 /
    _backendBase = url.replace(/\/+$/, '')
  }
}

/**
 * 获取后端基础地址
 */
export function getBackendBase() {
  return _backendBase
}

/**
 * 将图片路径解析为完整可访问的 URL
 * @param {string} url - 后端返回的图片路径
 * @returns {string} 完整 URL，若无效返回空字符串
 */
export function resolveImageUrl(url) {
  if (!url || typeof url !== 'string') return ''
  // 已经是完整 URL（http/https 开头），直接返回
  if (/^https?:\/\//i.test(url)) return url
  // 相对路径，拼接后端地址
  return _backendBase + (url.startsWith('/') ? url : '/' + url)
}
