import {defineStore} from 'pinia'
import {useRouter} from 'vue-router'
import dbUtils from '@/utils/util.storage'

export const useAuthStore = defineStore('Auth', () => {
  const router = useRouter()

  async function login(form) {
    // 简单校验用户名密码
    if (form.username === 'admin' && form.password === 'admin') {
      dbUtils.clear()
      dbUtils.set('token', 'stock-admin-token')
      dbUtils.set('userInfo', {
        username: 'admin',
        nickname: '管理员',
      })
      dbUtils.set('perms', ['*'])
      await router.push({path: '/'})
      return {nickname: '管理员'}
    } else {
      throw new Error('用户名或密码错误')
    }
  }

  async function logout() {
    dbUtils.clear()
    await router.replace('/login')
  }

  return {login, logout}
})
