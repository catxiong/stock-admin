// localStorage 工具
const t = import.meta.env.VITE_APP_WEB_TITLE || 'STOCK'
const v = import.meta.env.VITE_APP_WEB_VERSION || '1.0.0'

export default {
  set(key, value) {
    if (typeof value === 'object') {
      value = JSON.stringify(value)
    }
    localStorage.setItem(`${t}-${v}-` + key, value)
  },
  get(key) {
    const value = localStorage.getItem(`${t}-${v}-` + key)
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  },
  remove(key) {
    localStorage.removeItem(`${t}-${v}-` + key)
  },
  clear() {
    const prefix = `${t}-${v}-`
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i)
      if (storageKey.startsWith(prefix)) {
        keysToRemove.push(storageKey)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  },
}
