import request from '@/utils/request'
import { compressImageToBase64 } from '@/utils/imageCompress'

// 公式识别上传（自动压缩图片 + Base64 传输，减少带宽占用）
// mode: 'math'（数学公式，默认） | 'chem'（化学公式）
export async function recognizeUpload(file, mode = 'math') {
  // 先压缩图片为 Base64
  const base64 = await compressImageToBase64(file, {
    maxWidth: 1280,
    maxHeight: 1280,
    quality: 0.85,
  })
  // 以 JSON 格式发送 Base64 字符串 + 识别模式
  return request({
    url: '/recognize/upload',
    method: 'post',
    data: { image: base64, mode },
  })
}

// 提交反馈
export function submitFeedback(historyId, feedback) {
  return request({
    url: '/recognize/feedback',
    method: 'post',
    data: { historyId, feedback },
  })
}

// 获取用户统计
export function getUserStats() {
  return request({
    url: '/recognize/stats',
    method: 'get',
  })
}

// 分页获取历史记录
// 后端 DTO 字段名：page(从1开始,默认1)、size(默认10)；返回 { total, list: [...] }
export function getHistoryList(page = 1, size = 10) {
  return request({
    url: '/recognize/history',
    method: 'get',
    params: { page, size },
  })
}