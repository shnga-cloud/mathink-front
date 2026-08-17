import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import { login as loginApi, bindEmail as bindEmailApi } from '@/api/user'

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
