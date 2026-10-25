import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import { login as loginApi, bindEmail as bindEmailApi } from '@/api/user'
import { useRecognizeStore } from './recognize'
import { useHandwriteStore } from './handwrite'

export const useUserStore = defineStore(
  'user',
  () => {
    const token = ref('')
    const userInfo = ref({
      id: null,
      username: '',
      email: null,
    })

    const isLoggedIn = computed(() => !!token.value)

    const displayEmail = computed(() => {
      return userInfo.value.email || '未绑定邮箱'
    })

    const hasEmail = computed(() => !!userInfo.value.email)

    function setToken(newToken) {
      token.value = newToken
    }

    function setUserInfo(info) {
      userInfo.value = {
        id: info.id || null,
        username: info.username || '',
        email: info.email || null,
      }
    }

    async function login(loginForm) {
      const data = await loginApi(loginForm)
      setToken(data.token)
      setUserInfo({
        id: data.id,
        username: data.username,
        email: data.email,
      })
      return data
    }

    async function bindEmail(email) {
      await bindEmailApi(email)
      userInfo.value.email = email
      ElMessage.success({ message: '邮箱绑定成功', offset: 60 })
    }

    function logout() {
      // 清理识别会话（含预览 URL 资源），避免下个用户登录后看到上个用户的图片/结果
      const recStore = useRecognizeStore()
      const hwStore = useHandwriteStore()
      recStore.reset()
      hwStore.reset()
      // reset() 出于体验考虑会保留 mode，退出登录时彻底重置为默认
      recStore.mode = 'math'
      hwStore.mode = 'math'

      token.value = ''
      userInfo.value = {
        id: null,
        username: '',
        email: null,
      }
    }

    return {
      token,
      userInfo,
      isLoggedIn,
      displayEmail,
      hasEmail,
      setToken,
      setUserInfo,
      login,
      bindEmail,
      logout,
    }
  },
  {
    persist: {
      key: 'mathink_user',
      paths: ['token', 'userInfo'],
    },
  }
)
