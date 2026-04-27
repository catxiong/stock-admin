<template>
  <div class="stock-page">
    <el-card shadow="never">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-form :model="searchForm" inline>
          <el-form-item label="股票代码">
            <el-input v-model="searchForm.stockCode" placeholder="模糊搜索" clearable @clear="handleSearch"/>
          </el-form-item>
          <el-form-item label="股票名称">
            <el-input v-model="searchForm.stockName" placeholder="请输入股票名称" clearable @clear="handleSearch"/>
          </el-form-item>
          <el-form-item label="所属板块">
            <el-select v-model="searchForm.sectorCode" placeholder="输入板块名称搜索" clearable filterable
                       :filter-method="filterSector" :loading="sectorLoading" @clear="onSectorClear">
              <el-option v-for="item in filteredSectorOptions" :key="item.value" :label="item.label" :value="item.value"/>
            </el-select>
          </el-form-item>
          <el-form-item label="涨跌幅%">
            <div style="display:flex;align-items:center;gap:4px">
              <el-input v-model="searchForm.minChange" placeholder="最低" style="width:80px" clearable/>
              <span>~</span>
              <el-input v-model="searchForm.maxChange" placeholder="最高" style="width:80px" clearable/>
            </div>
          </el-form-item>
          <el-form-item label="含ST">
            <el-switch v-model="searchForm.includeSt" inline-prompt active-text="是" inactive-text="否"/>
          </el-form-item>
        </el-form>
        <div class="search-actions">
          <el-button type="primary" @click="handleSearch" :icon="Search" round>搜索</el-button>
          <el-button type="info" @click="resetSearch" :icon="Refresh" round plain>重置</el-button>
        </div>
      </div>

      <!-- 排序 -->
      <SortBar :fields="stockSortFields" v-model="sortItems" @change="onSortChange"/>

      <!-- 表格 -->
      <el-table :data="tableData" stripe v-loading="loading" highlight-current-row
                @row-click="handleRowClick" style="cursor: pointer" :max-height="tableMaxHeight">
        <el-table-column prop="stockCode" label="股票代码" width="110"/>
        <el-table-column prop="stockName" label="股票名称" min-width="140"/>
        <el-table-column prop="exchange" label="市场" width="80" align="center">
          <template #default="{row}">
            <el-tag :type="row.exchange === 'SH' ? 'danger' : 'primary'" size="small">
              {{ row.exchange }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sectorName" label="所属板块" min-width="140"/>
        <el-table-column prop="currentPrice" label="现价" width="100" align="right"/>
        <el-table-column prop="priceChange" label="涨跌额" width="120" align="right">
          <template #default="{row}">
            <span :class="row.priceChange > 0 ? 'text-red' : row.priceChange < 0 ? 'text-green' : ''">
              {{ row.priceChange > 0 ? '+' : '' }}{{ row.priceChange }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="priceChangePercent" label="涨跌幅(%)" width="130" align="right">
          <template #default="{row}">
            <span :class="row.priceChangePercent > 0 ? 'text-red' : row.priceChangePercent < 0 ? 'text-green' : ''">
              {{ row.priceChangePercent > 0 ? '+' : '' }}{{ row.priceChangePercent }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="turnoverRate" label="换手率(%)" width="130" align="right"/>
        <el-table-column prop="volumeRatio" label="量比" width="100" align="right"/>
        <el-table-column prop="rsi30" label="RSI30" width="100" align="right"/>
        <el-table-column prop="tradeDate" label="交易日期" width="120" align="center"/>
        <el-table-column label="操作" width="80" fixed="right" align="center">
          <template #default="{row}">
            <el-button type="warning" link size="small" @click.stop="addToWatchlist(row)" :icon="Star">自选</el-button>
          </template>
        </el-table-column>
        <el-table-column label="外部链接" width="150" fixed="right" align="center">
          <template #default="{row}">
            <a :href="`https://quote.eastmoney.com/concept/${row.exchange}${row.stockCode}.html`"
               target="_blank" class="link-btn eastrich" @click.stop>
              <el-icon size="16"><TrendCharts/></el-icon>EastRich</a>
            <a :href="`https://finance.baidu.com/stock/ab-${row.stockCode}`"
               target="_blank" class="link-btn finscope" @click.stop>
              <el-icon size="16"><DataLine/></el-icon>FinScope</a>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-box">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import {getAShareList, getSectorList, addWatchlist} from '@/api/modules/api.stock'
import {useRoute, useRouter} from 'vue-router'
import SortBar from '@/components/SortBar.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const sectorLoading = ref(false)
const tableData = ref([])
const allSectorOptions = ref([])
const filteredSectorOptions = ref([])
const sortItems = ref([])
const tableMaxHeight = computed(() => window.innerHeight - 280)

const stockSortFields = [
  {field: 'priceChangePercent', label: '涨跌幅'},
  {field: 'priceChange', label: '涨跌额'},
  {field: 'currentPrice', label: '现价'},
  {field: 'turnoverRate', label: '换手率'},
  {field: 'volumeRatio', label: '量比'},
  {field: 'rsi30', label: 'RSI30'},
  {field: 'yearHighPrice', label: '年最高价'},
  {field: 'yearLowPrice', label: '年最低价'},
  {field: 'monthHighPrice', label: '月最高价'},
  {field: 'monthLowPrice', label: '月最低价'},
]

const searchForm = reactive({
  stockCode: '',
  stockName: '',
  sectorCode: '',
  minChange: '',
  maxChange: '',
  maxChangeInclusive: false,
  minChangeInclusive: true,
  includeSt: false,
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 20,
  total: 0,
})

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
    }
    if (searchForm.stockCode) params.stockCode = searchForm.stockCode
    if (searchForm.stockName) params.stockName = searchForm.stockName
    if (searchForm.sectorCode) params.sectorCode = searchForm.sectorCode
    if (searchForm.minChange !== '' && searchForm.minChange !== null) params.minChange = searchForm.minChange
    if (searchForm.maxChange !== '' && searchForm.maxChange !== null) params.maxChange = searchForm.maxChange
    if (searchForm.maxChangeInclusive) params.maxChangeInclusive = true
    if (!searchForm.minChangeInclusive) params.minChangeInclusive = false
    if (searchForm.includeSt) params.includeSt = true
    // 排序参数：取优先级最高的排序项
    if (sortItems.value.length > 0) {
      params.sortField = sortItems.value[0].field
      params.sortOrder = sortItems.value[0].order
    }

    const res = await getAShareList(params)
    tableData.value = res.data?.records || []
    pagination.total = res.data?.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  fetchData()
}

const onSortChange = () => {
  pagination.pageNum = 1
  fetchData()
}

const resetSearch = () => {
  searchForm.stockCode = ''
  searchForm.stockName = ''
  searchForm.sectorCode = ''
  searchForm.minChange = ''
  searchForm.maxChange = ''
  searchForm.maxChangeInclusive = false
  searchForm.minChangeInclusive = true
  searchForm.includeSt = false
  sortItems.value = []
  handleSearch()
}

// 前端模糊搜索板块
const filterSector = (query) => {
  if (!query) {
    filteredSectorOptions.value = allSectorOptions.value.slice(0, 50)
    return
  }
  const q = query.toLowerCase()
  filteredSectorOptions.value = allSectorOptions.value.filter(
    item => item.label.toLowerCase().includes(q) || item.value.toLowerCase().includes(q)
  ).slice(0, 50)
}

const onSectorClear = () => {
  filteredSectorOptions.value = allSectorOptions.value.slice(0, 50)
}

// 加载全部板块
const loadAllSectors = async () => {
  sectorLoading.value = true
  try {
    const res = await getSectorList({pageNum: 1, pageSize: 500})
    allSectorOptions.value = (res.data?.records || []).map(s => ({
      value: s.sectorCode,
      label: `${s.sectorName} (${s.sectorCode})`,
    }))
    filteredSectorOptions.value = allSectorOptions.value.slice(0, 50)
  } catch {
  } finally {
    sectorLoading.value = false
  }
}

const handleRowClick = (row) => {
  router.push({path: '/stock-detail', query: {stockCode: row.stockCode}})
}

const addToWatchlist = async (row) => {
  try {
    await addWatchlist({stockCode: row.stockCode, stockName: row.stockName})
    ElMessage.success(`${row.stockName} 已加入自选`)
  } catch {
    ElMessage.warning('添加失败，可能已在自选股中')
  }
}

// 处理从板块模块跳转过来的板块筛选
const applyRouteQuery = () => {
  if (route.query.sectorCode) {
    searchForm.sectorCode = route.query.sectorCode
  }
  if (route.query.minChange) {
    searchForm.minChange = route.query.minChange
  }
  if (route.query.maxChange) {
    searchForm.maxChange = route.query.maxChange
  }
  if (route.query.maxChangeInclusive === 'true') {
    searchForm.maxChangeInclusive = true
  }
  if (route.query.minChangeInclusive === 'false') {
    searchForm.minChangeInclusive = false
  }
  if (route.query.includeSt === 'true') {
    searchForm.includeSt = true
  }
}

// 初始化：先加载板块选项，再搜索（确保select能回显板块名称）
onMounted(async () => {
  await loadAllSectors()
  applyRouteQuery()
  fetchData()
})

// keep-alive 缓存后，监听路由变化处理跳转
watch(() => route.query, (query) => {
  if (query.sectorCode || query.minChange || query.maxChange || query.includeSt) {
    searchForm.sectorCode = query.sectorCode || ''
    searchForm.minChange = query.minChange || ''
    searchForm.maxChange = query.maxChange || ''
    searchForm.maxChangeInclusive = query.maxChangeInclusive === 'true'
    searchForm.minChangeInclusive = query.minChangeInclusive !== 'false'
    searchForm.includeSt = query.includeSt === 'true'
    handleSearch()
  }
}, {deep: true})
</script>

<style lang="scss" scoped>
.search-bar {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  :deep(.el-form--inline .el-form-item) {
    margin-right: 16px;
  }

  .search-actions {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 4px;
  }
}

.pagination-box {
  margin-top: 20px;
  padding-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.text-red {
  color: #f56c6c;
  font-weight: bold;
}

.text-green {
  color: #67c23a;
  font-weight: bold;
}

.link-btn {
  font-size: 12px;
  text-decoration: none;
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  &:hover {
    text-decoration: underline;
  }
  &.eastrich {
    color: #e6a23c;
  }
  &.finscope {
    color: #409eff;
  }
}
</style>
