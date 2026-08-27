import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'
import { setBackendBase } from '@/utils/imageUrl'

const request = axios.create({
  // baseURL: 'http://xg-2.frp.one:65366',
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
})

// 将后端 baseURL 同步给图片 URL 解析工具
setBackendBase(request.defaults.baseURL)

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    const token = userStore.token

    // 登录和注册接口不需要携带token
    const isAuthUrl = config.url.includes('/user/login') || config.url.includes('/user/register')

    if (token && !isAuthUrl) {
      config.headers.Authorization = token
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data

    if (res.code === 200) {
      return res.data
    }

    if (res.code === 500) {
      ElMessage({
        message: res.message || '请求失败',
        type: 'error',
        duration: 3000,
      })
      return Promise.reject(new Error(res.message || '请求失败'))
    }

    return res
  },
  (error) => {
    const userStore = useUserStore()

    if (error.response) {
      const status = error.response.status

      if (status === 401) {
        ElMessage({
          message: '登录已过期，请重新登录',
          type: 'warning',
          duration: 3000,
        })
        userStore.logout()
        router.push('/login')
      } else {
        ElMessage({
          message: error.response.data?.message || '系统繁忙，请稍后重试',
          type: 'error',
          duration: 3000,
        })
      }
    } else {
      ElMessage({
        message: '网络异常，请检查网络连接',
        type: 'error',
        duration: 3000,
      })
    }

    return Promise.reject(error)
  }
)

export default request
