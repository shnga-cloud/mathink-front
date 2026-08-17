import request from '@/utils/request'

// 公式识别上传
export function recognizeUpload(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/recognize/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
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
// 约定参数：pageNum(从1开始)、pageSize；返回 { total, list: [...] }
export function getHistoryList(pageNum = 1, pageSize = 10) {
  return request({
    url: '/recognize/history',
    method: 'get',
    params: { pageNum, pageSize },
  })
}