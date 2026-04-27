import {createRouter, createWebHashHistory} from 'vue-router'
import routes from './routes'
import dbUtils from '@/utils/util.storage'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({left: 0, top: 0}),
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    const token = dbUtils.get('token')
    if (token) {
      if (to.name === 'login') {
        return next('/')
      }
      return next()
    }
    return next({name: 'login'})
  }
  next()
})

router.afterEach(to => {
  document.title = `${to.meta.title || ''} | A股数据平台`
})

export default router
