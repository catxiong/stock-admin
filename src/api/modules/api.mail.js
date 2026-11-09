import service from '@/api/server'

// 获取提醒邮箱配置（后端不回传明文密码）
export function getMailConfig() {
  return service.get('/stock/stock/mail-config')
}

// 保存提醒邮箱配置（单条，表为空时新增）
export function saveMailConfig(data) {
  return service.put('/stock/stock/mail-config', data)
}
