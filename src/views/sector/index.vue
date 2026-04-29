<template>
  <div class="sector-page">
    <el-card shadow="never">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-form :model="searchForm" inline>
          <el-form-item label="板块名称">
            <el-input v-model="searchForm.sectorName" placeholder="请输入板块名称" clearable @clear="handleSearch"/>
          </el-form-item>
          <el-form-item label="板块代码">
            <el-input v-model="searchForm.sectorCode" placeholder="请输入板块代码" clearable @clear="handleSearch"/>
          </el-form-item>
          <el-form-item label="板块类型">
            <el-select v-model="searchForm.sectorType" placeholder="全部类型" clearable>
              <el-option label="行业板块" value="industry"/>
              <el-option label="概念板块" value="concept"/>
              <el-option label="地区板块" value="area"/>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
            <el-button @click="resetSearch" :icon="Refresh">重置</el-button>
            <el-button type="success" @click="handleExport" :icon="Download" plain :loading="exportLoading">导出</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 排序 -->
      <SortBar :fields="sectorSortFields" v-model="sortItems" @change="onSortChange"/>

      <!-- 表格 -->
      <el-table :data="tableData" stripe v-loading="loading" @row-click="handleRowClick"
                style="cursor: pointer" highlight-current-row :max-height="tableMaxHeight">
        <el-table-column prop="sectorCode" label="板块代码" width="120"/>
        <el-table-column prop="sectorName" label="板块名称" min-width="160"/>
        <el-table-column prop="sectorType" label="板块类型" width="100" align="center">
          <template #default="{row}">
            <el-tag :type="typeTagMap[row.sectorType]" size="small">
              {{ typeLabelMap[row.sectorType] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="currentIndex" label="当前指数" width="120" align="right"/>
        <el-table-column prop="changeRate" label="涨跌幅(%)" width="130" align="right">
          <template #default="{row}">
            <span :class="row.changeRate > 0 ? 'text-red' : row.changeRate < 0 ? 'text-green' : ''">
              {{ row.changeRate > 0 ? '+' : '' }}{{ row.changeRate }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="yearHighIndex" label="年最高" width="110" align="right"/>
        <el-table-column prop="yearLowIndex" label="年最低" width="110" align="right"/>
        <el-table-column prop="monthHighIndex" label="月最高" width="110" align="right"/>
        <el-table-column prop="monthLowIndex" label="月最低" width="110" align="right"/>
        <el-table-column prop="tradeDate" label="数据日期" width="120" align="center" fixed="right"/>
        <el-table-column label="操作" width="110" fixed="right" align="center">
          <template #default="{row}">
            <el-button type="primary" link size="small" @click.stop="viewStocks(row)">查看成分股</el-button>
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
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import {getSectorList, exportSectors} from '@/api/modules/api.stock'
import {useRoute, useRouter} from 'vue-router'
import SortBar from '@/components/SortBar.vue'

const route = useRoute()
const router = useRouter()

const typeTagMap = {industry: '', concept: 'warning', area: 'success'}
const typeLabelMap = {industry: '行业', concept: '概念', area: '地区'}

const loading = ref(false)
const exportLoading = ref(false)
const tableData = ref([])
const sortItems = ref([])
const tableMaxHeight = computed(() => window.innerHeight - 280)

const sectorSortFields = [
  {field: 'changeRate', label: '涨跌幅'},
  {field: 'currentIndex', label: '当前指数'},
  {field: 'yearHighIndex', label: '年最高'},
  {field: 'yearLowIndex', label: '年最低'},
  {field: 'monthHighIndex', label: '月最高'},
  {field: 'monthLowIndex', label: '月最低'},
]

const searchForm = reactive({
  sectorName: '',
  sectorCode: '',
  sectorType: '',
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
    if (searchForm.sectorName) params.sectorName = searchForm.sectorName
    if (searchForm.sectorCode) params.sectorCode = searchForm.sectorCode
    if (searchForm.sectorType) params.sectorType = searchForm.sectorType
    // 排序参数
    if (sortItems.value.length > 0) {
      params.sortField = sortItems.value[0].field
      params.sortOrder = sortItems.value[0].order
    }

    const res = await getSectorList(params)
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
  searchForm.sectorName = ''
  searchForm.sectorCode = ''
  searchForm.sectorType = ''
  sortItems.value = []
  handleSearch()
}

const handleExport = async () => {
  exportLoading.value = true
  try {
    const params = {}
    if (searchForm.sectorName) params.sectorName = searchForm.sectorName
    if (searchForm.sectorCode) params.sectorCode = searchForm.sectorCode
    if (searchForm.sectorType) params.sectorType = searchForm.sectorType
    if (sortItems.value.length > 0) {
      params.sortField = sortItems.value[0].field
      params.sortOrder = sortItems.value[0].order
    }
    const res = await exportSectors(params)
    const blob = new Blob([res.origin.data], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = '板块数据.xlsx'
    link.click()
    URL.revokeObjectURL(link.href)
    ElMessage.success('导出成功')
  } catch (e) {
    console.error(e)
    ElMessage.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

const handleRowClick = (row) => {
  viewStocks(row)
}

const viewStocks = (row) => {
  router.push({path: '/stock/list', query: {sectorCode: row.sectorCode, sectorName: row.sectorName}})
}

onMounted(() => {
  // 从路由参数回填搜索条件
  if (route.query.sectorType) searchForm.sectorType = route.query.sectorType
  if (route.query.sectorName) searchForm.sectorName = route.query.sectorName
  fetchData()
})

// keep-alive 缓存后，监听路由变化
watch(() => route.query, (query) => {
  if (query.sectorType || query.sectorName) {
    searchForm.sectorType = query.sectorType || ''
    searchForm.sectorName = query.sectorName || ''
    handleSearch()
  }
}, {deep: true})
</script>

<style lang="scss" scoped>
.search-bar {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
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
</style>
