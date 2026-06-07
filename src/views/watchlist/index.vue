<template>
  <div class="watchlist-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>我的自选股</span>
          <div class="header-actions">
            <el-select v-model="refreshInterval" placeholder="刷新频率" clearable size="small"
                       style="width: 120px" :disabled="autoRefreshing">
              <el-option v-for="s in intervalOptions" :key="s.value" :label="s.label" :value="s.value"/>
            </el-select>
            <el-button type="warning" size="small" :icon="Refresh" :loading="refreshing"
                       @click="handleRefresh" :disabled="loading">
              {{ autoRefreshing ? '停止刷新' : '重计算' }}
            </el-button>
            <el-button type="primary" size="small" :icon="Plus" @click="showAddDialog">添加自选</el-button>
            <el-button type="success" size="small" :icon="Download" plain :loading="exportLoading" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>

      <!-- 表格 -->
      <el-table :data="tableData" stripe v-loading="loading" highlight-current-row
                row-key="id" @row-click="handleRowClick" style="cursor: pointer" :max-height="tableMaxHeight">
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
        <el-table-column prop="currentPrice" label="现价" width="100" align="right" sortable/>
        <el-table-column prop="priceChange" label="涨跌额" width="120" align="right" sortable>
          <template #default="{row}">
            <span :class="row.priceChange > 0 ? 'text-red' : row.priceChange < 0 ? 'text-green' : ''">
              {{ row.priceChange > 0 ? '+' : '' }}{{ row.priceChange }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="priceChangePercent" label="涨跌幅(%)" width="130" align="right" sortable>
          <template #default="{row}">
            <span :class="row.priceChangePercent > 0 ? 'text-red' : row.priceChangePercent < 0 ? 'text-green' : ''">
              {{ row.priceChangePercent > 0 ? '+' : '' }}{{ row.priceChangePercent }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="costPrice" label="成本价" width="110" align="right">
          <template #default="{row}">{{ row.costPrice || '-' }}</template>
        </el-table-column>
        <el-table-column prop="shareCount" label="持股数" width="110" align="right">
          <template #default="{row}">{{ row.shareCount || '-' }}</template>
        </el-table-column>
        <el-table-column prop="expectedSellPrice" label="预期卖出价" width="120" align="right">
          <template #default="{row}">{{ row.expectedSellPrice || '-' }}</template>
        </el-table-column>
        <el-table-column prop="turnoverRate" label="换手率(%)" width="130" align="right" sortable/>
        <el-table-column prop="addTime" label="添加时间" width="170" align="center"/>
        <el-table-column prop="remark" label="备注" min-width="140">
          <template #default="{row}">{{ row.remark || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{row}">
            <el-popover placement="left" :width="280" trigger="hover">
              <template #reference>
                <el-button type="primary" link size="small" @click.stop="openDataDialog(row)">数据</el-button>
              </template>
              <div class="data-popover">
                <div class="data-row">
                  <span class="data-label">成本价</span>
                  <span class="data-value">{{ row.costPrice || '-' }}</span>
                </div>
                <div class="data-row">
                  <span class="data-label">持股数</span>
                  <span class="data-value">{{ row.shareCount || '-' }}</span>
                </div>
                <div class="data-row">
                  <span class="data-label">预期卖出价</span>
                  <span class="data-value">{{ row.expectedSellPrice || '-' }}</span>
                </div>
                <el-divider style="margin: 8px 0"/>
                <div class="data-row">
                  <span class="data-label">盈亏额</span>
                  <span class="data-value" :class="row.profitLossAmount > 0 ? 'text-red' : row.profitLossAmount < 0 ? 'text-green' : ''">
                    {{ row.profitLossAmount != null ? (row.profitLossAmount > 0 ? '+' : '') + row.profitLossAmount : '-' }}
                  </span>
                </div>
                <div class="data-row">
                  <span class="data-label">盈亏率(%)</span>
                  <span class="data-value" :class="row.profitLossPercent > 0 ? 'text-red' : row.profitLossPercent < 0 ? 'text-green' : ''">
                    {{ row.profitLossPercent != null ? (row.profitLossPercent > 0 ? '+' : '') + row.profitLossPercent : '-' }}
                  </span>
                </div>
                <div class="data-row">
                  <span class="data-label">盈亏总额</span>
                  <span class="data-value" :class="row.profitLossTotal > 0 ? 'text-red' : row.profitLossTotal < 0 ? 'text-green' : ''">
                    {{ row.profitLossTotal != null ? (row.profitLossTotal > 0 ? '+' : '') + row.profitLossTotal : '-' }}
                  </span>
                </div>
              </div>
            </el-popover>
            <el-button type="primary" link size="small" @click.stop="editRemark(row)">备注</el-button>
            <el-button type="danger" link size="small" @click.stop="handleRemove(row)">移除</el-button>
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

    <!-- 数据编辑弹窗 -->
    <el-dialog v-model="dataDialogVisible" :title="`数据 - ${dataForm.stockName}(${dataForm.stockCode})`" width="460px" destroy-on-close>
      <el-form :model="dataForm" label-width="80px" class="data-edit-form">
        <el-form-item label="成本价">
          <el-input-number v-model="dataForm.costPrice" :precision="2" :min="0" :controls="false" style="width: 100%"/>
        </el-form-item>
        <el-form-item label="持股数">
          <el-input-number v-model="dataForm.shareCount" :min="0" :controls="false" style="width: 100%"/>
        </el-form-item>
        <el-form-item label="预期卖出价">
          <el-input-number v-model="dataForm.expectedSellPrice" :precision="2" :min="0" :controls="false" style="width: 100%"/>
        </el-form-item>
        <el-divider style="margin: 4px 0 16px"/>
        <el-form-item label="盈亏额">
          <span :class="computedProfitLossAmount > 0 ? 'text-red' : computedProfitLossAmount < 0 ? 'text-green' : ''">
            {{ computedProfitLossAmount != null ? (computedProfitLossAmount > 0 ? '+' : '') + computedProfitLossAmount : '-' }}
          </span>
        </el-form-item>
        <el-form-item label="盈亏率(%)">
          <span :class="computedProfitLossPercent > 0 ? 'text-red' : computedProfitLossPercent < 0 ? 'text-green' : ''">
            {{ computedProfitLossPercent != null ? (computedProfitLossPercent > 0 ? '+' : '') + computedProfitLossPercent : '-' }}
          </span>
        </el-form-item>
        <el-form-item label="盈亏总额">
          <span :class="computedProfitLossTotal > 0 ? 'text-red' : computedProfitLossTotal < 0 ? 'text-green' : ''">
            {{ computedProfitLossTotal != null ? (computedProfitLossTotal > 0 ? '+' : '') + computedProfitLossTotal : '-' }}
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dataDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dataSaving" @click="saveData">保存</el-button>
      </template>
    </el-dialog>

    <!-- 添加自选股弹窗 -->
    <el-dialog v-model="addDialogVisible" title="添加自选股" width="460px" destroy-on-close>
      <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="80px">
        <el-form-item label="股票代码" prop="stockCode">
          <el-input v-model="addForm.stockCode" placeholder="请输入股票代码，如 600000"/>
        </el-form-item>
        <el-form-item label="股票名称" prop="stockName">
          <el-input v-model="addForm.stockName" placeholder="请输入股票名称"/>
        </el-form-item>
        <el-form-item label="成本价">
          <el-input-number v-model="addForm.costPrice" :precision="2" :min="0" :controls="false" placeholder="可选" style="width: 100%"/>
        </el-form-item>
        <el-form-item label="持股数">
          <el-input-number v-model="addForm.shareCount" :min="0" :controls="false" placeholder="可选" style="width: 100%"/>
        </el-form-item>
        <el-form-item label="预期卖出价">
          <el-input-number v-model="addForm.expectedSellPrice" :precision="2" :min="0" :controls="false" placeholder="可选" style="width: 100%"/>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="addForm.remark" placeholder="可选，添加备注"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="addLoading" @click="handleAdd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {getWatchlist, addWatchlist, removeWatchlist, updateWatchlistRemark, refreshWatchlist, exportWatchlist, updateWatchlistData} from '@/api/modules/api.stock'
import {useRouter} from 'vue-router'
import {Refresh, Plus, TrendCharts, DataLine} from '@element-plus/icons-vue'

const router = useRouter()

const loading = ref(false)
const refreshing = ref(false)
const autoRefreshing = ref(false)
const addLoading = ref(false)
const exportLoading = ref(false)
const dataSaving = ref(false)
const tableData = ref([])
const addDialogVisible = ref(false)
const addFormRef = ref()
const dataDialogVisible = ref(false)
const tableMaxHeight = computed(() => window.innerHeight - 280)
let autoTimer = null

const refreshInterval = ref(null)
const intervalOptions = [
  { label: '5秒', value: 5 },
  { label: '10秒', value: 10 },
  { label: '15秒', value: 15 },
  { label: '20秒', value: 20 },
  { label: '30秒', value: 30 },
  { label: '60秒', value: 60 },
]

const pagination = reactive({
  pageNum: 1,
  pageSize: 20,
  total: 0,
})

const addForm = reactive({
  stockCode: '',
  stockName: '',
  costPrice: null,
  shareCount: null,
  expectedSellPrice: null,
  remark: '',
})

const addRules = reactive({
  stockCode: [{required: true, message: '请输入股票代码', trigger: 'blur'}],
  stockName: [{required: true, message: '请输入股票名称', trigger: 'blur'}],
})

const dataForm = reactive({
  id: null,
  stockCode: '',
  stockName: '',
  costPrice: null,
  shareCount: null,
  expectedSellPrice: null,
  currentPrice: null,
})

// 盈亏额 = 现价 - 成本价
const computedProfitLossAmount = computed(() => {
  if (dataForm.currentPrice == null || dataForm.costPrice == null) return null
  return +(dataForm.currentPrice - dataForm.costPrice).toFixed(2)
})

// 盈亏率(%) = (现价 - 成本价) / 成本价 * 100
const computedProfitLossPercent = computed(() => {
  if (dataForm.currentPrice == null || dataForm.costPrice == null || dataForm.costPrice === 0) return null
  return +((dataForm.currentPrice - dataForm.costPrice) / dataForm.costPrice * 100).toFixed(2)
})

// 盈亏总额 = 盈亏额 * 持股数
const computedProfitLossTotal = computed(() => {
  if (computedProfitLossAmount.value == null || dataForm.shareCount == null) return null
  return +(computedProfitLossAmount.value * dataForm.shareCount).toFixed(2)
})

// 获取当前页面所有股票代码
const getStockCodes = () => tableData.value.map(r => r.stockCode).filter(Boolean)

const handleRowClick = (row) => {
  router.push({path: '/stock-detail', query: {stockCode: row.stockCode}})
}

// 刷新行情数据（调后端）
const doRefresh = async () => {
  const codes = getStockCodes()
  if (codes.length === 0) return
  refreshing.value = true
  try {
    await refreshWatchlist(codes)
    await fetchData()
  } catch (e) {
    // ignore
  } finally {
    refreshing.value = false
  }
}

// 点击重计算按钮
const handleRefresh = async () => {
  if (autoRefreshing.value) {
    stopAutoRefresh()
    return
  }
  await doRefresh()
  if (refreshInterval.value) {
    autoRefreshing.value = true
    autoTimer = setInterval(() => {
      doRefresh()
    }, refreshInterval.value * 1000)
  }
}

const stopAutoRefresh = () => {
  autoRefreshing.value = false
  if (autoTimer) {
    clearInterval(autoTimer)
    autoTimer = null
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getWatchlist({pageNum: pagination.pageNum, pageSize: pagination.pageSize})
    tableData.value = res.data?.records || []
    pagination.total = res.data?.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleRemove = async (row) => {
  try {
    await ElMessageBox.confirm(`确定移除 ${row.stockName}(${row.stockCode})？`, '提示', {type: 'warning'})
    await removeWatchlist(row.id)
    ElMessage.success('已移除')
    fetchData()
  } catch {
    // 用户取消
  }
}

// 数据弹框
const openDataDialog = (row) => {
  dataForm.id = row.id
  dataForm.stockCode = row.stockCode
  dataForm.stockName = row.stockName
  dataForm.costPrice = row.costPrice
  dataForm.shareCount = row.shareCount
  dataForm.expectedSellPrice = row.expectedSellPrice
  dataForm.currentPrice = row.currentPrice
  dataDialogVisible.value = true
}

const saveData = async () => {
  dataSaving.value = true
  try {
    await updateWatchlistData({
      id: dataForm.id,
      costPrice: dataForm.costPrice,
      shareCount: dataForm.shareCount,
      expectedSellPrice: dataForm.expectedSellPrice,
    })
    ElMessage.success('数据已保存')
    dataDialogVisible.value = false
    fetchData()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    dataSaving.value = false
  }
}

// 备注编辑
const editRemark = (row) => {
  ElMessageBox.prompt('修改备注', '备注', {
    inputValue: row.remark || '',
    confirmButtonText: '保存',
    cancelButtonText: '取消',
  }).then(async ({value}) => {
    try {
      await updateWatchlistRemark({id: row.id, remark: value})
      ElMessage.success('备注已更新')
      fetchData()
    } catch {
      ElMessage.error('更新失败')
    }
  }).catch(() => {})
}

const showAddDialog = () => {
  addForm.stockCode = ''
  addForm.stockName = ''
  addForm.costPrice = null
  addForm.shareCount = null
  addForm.expectedSellPrice = null
  addForm.remark = ''
  addDialogVisible.value = true
}

const handleAdd = () => {
  addFormRef.value.validate(async (valid) => {
    if (!valid) return
    addLoading.value = true
    try {
      await addWatchlist({
        stockCode: addForm.stockCode,
        stockName: addForm.stockName,
        costPrice: addForm.costPrice,
        shareCount: addForm.shareCount,
        expectedSellPrice: addForm.expectedSellPrice,
        remark: addForm.remark,
      })
      ElMessage.success('添加成功')
      addDialogVisible.value = false
      fetchData()
    } catch (e) {
      ElMessage.error('添加失败，可能已存在该自选股')
    } finally {
      addLoading.value = false
    }
  })
}

const handleExport = async () => {
  exportLoading.value = true
  try {
    const res = await exportWatchlist()
    const blob = new Blob([res.origin.data], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = '自选股数据.xlsx'
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

onMounted(() => fetchData())
onActivated(() => fetchData())
onUnmounted(() => stopAutoRefresh())
</script>

<style lang="scss" scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

.text-red { color: #f56c6c; font-weight: bold; }
.text-green { color: #67c23a; font-weight: bold; }

.pagination-box {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.data-popover {
  .data-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;

    .data-label {
      color: #909399;
      font-size: 13px;
    }

    .data-value {
      font-size: 13px;
      font-weight: 500;
    }
  }
}

.data-edit-form {
  :deep(.el-form-item) {
    margin-bottom: 22px;
  }
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
