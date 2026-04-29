import service from '@/api/server'

// 分页查询A股股票
export function getAShareList(params) {
  return service.get('/stock/stock/aShare', params)
}

// 分页查询板块列表
export function getSectorList(params) {
  return service.get('/stock/stock/sector/list', params)
}

// 获取板块详情
export function getSectorByCode(sectorCode) {
  return service.get(`/stock/stock/sector/get/${sectorCode}`)
}

// 分页查询自选股
export function getWatchlist(params) {
  return service.get('/stock/stock/watchlist/list', params)
}

// 添加自选股
export function addWatchlist(data) {
  return service.post('/stock/stock/watchlist/add', data)
}

// 移除自选股
export function removeWatchlist(id) {
  return service.delete(`/stock/stock/watchlist/remove/${id}`)
}

// 更新自选股备注
export function updateWatchlistRemark(params) {
  return service.put('/stock/stock/watchlist/remark', null, params)
}

// 刷新自选股行情数据
export function refreshWatchlist(stockCodes) {
  return service.post('/stock/stock/watchlist/refresh', { stockCodes })
}

// 涨跌幅分布统计
export function getPriceChangeDistribution() {
  return service.get('/stock/stock/aShare/distribution')
}

// 导出全股数据
export function exportStocks(params) {
  return service.download('/stock/stock/aShare/export', params)
}

// 导出板块数据
export function exportSectors(params) {
  return service.download('/stock/stock/sector/export', params)
}

// 导出自选股数据
export function exportWatchlist() {
  return service.download('/stock/stock/watchlist/export')
}
