import axios from 'axios'
import JSONbig from 'json-bigint'
import dbUtils from '@/utils/util.storage'
import {ElNotification} from 'element-plus'
import router from '@/router'

// 配置 json-bigint，大整数转为字符串避免精度丢失
const JSONbigString = JSONbig({storeAsString: true})

const instance = axios.create({
  timeout: 15000,
  // 用 json-bigint 替代原生 JSON.parse
  transformResponse: [data => {
    if (typeof data === 'string') {
      try {
        return JSONbigString.parse(data)
      } catch {
        return data
      }
    }
    return data
  }],
})

// 请求拦截器
instance.interceptors.request.use(
  config => {
    const token = dbUtils.get('token')
    if (token) {
      config.headers.authorization = token
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
instance.interceptors.response.use(
  response => {
    return Promise.resolve({
      status: true,
      message: 'success',
      data: response.data,
      origin: response,
    })
  },
  error => {
    if (error.response) {
      const status = error.response.status
      switch (status) {
        case 401:
          router.push({path: '/login'})
          ElNotification.error('账号已过期，请重新登录')
          break
        case 500:
          ElNotification.error('服务器内部错误')
          break
        default:
          ElNotification.error(`请求错误: ${status}`)
      }
    } else {
      ElNotification.error('网络连接异常')
    }
    return Promise.reject(error)
  }
)

class AxiosService {
  constructor() {
    if (AxiosService.instance) return AxiosService.instance
    AxiosService.instance = this
  }

  get(url, params = null) {
    return instance.request({method: 'get', url, params})
  }

  post(url, data = null, params = null) {
    return instance.request({method: 'post', url, data, params})
  }

  put(url, data = null, params = null) {
    return instance.request({method: 'put', url, data, params})
  }

  delete(url, params = null) {
    return instance.request({method: 'delete', url, params})
  }

  download(url, params = null) {
    return instance.request({method: 'get', url, params, responseType: 'blob'})
  }
}

const axiosService = new AxiosService()
export default axiosService
