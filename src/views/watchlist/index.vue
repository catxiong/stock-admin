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
          </div>
        </div>
      </template>

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
        <el-table-column prop="turnoverRate" label="换手率(%)" width="130" align="right" sortable/>
        <el-table-column prop="addTime" label="添加时间" width="170" align="center"/>
        <el-table-column prop="remark" label="备注" min-width="140">
          <template #default="{row}">
            <span v-if="!row._editing">{{ row.remark || '-' }}</span>
            <el-input v-else v-model="row._remark" size="small" style="width: 120px"
                      @keyup.enter="saveRemark(row)" @blur="saveRemark(row)"/>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{row}">
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

    <!-- 添加自选股弹窗 -->
    <el-dialog v-model="addDialogVisible" title="添加自选股" width="460px" destroy-on-close>
      <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="80px">
        <el-form-item label="股票代码" prop="stockCode">
          <el-input v-model="addForm.stockCode" placeholder="请输入股票代码，如 600000"/>
        </el-form-item>
        <el-form-item label="股票名称" prop="stockName">
          <el-input v-model="addForm.stockName" placeholder="请输入股票名称"/>
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
import {getWatchlist, addWatchlist, removeWatchlist, updateWatchlistRemark, refreshWatchlist} from '@/api/modules/api.stock'
import {useRouter} from 'vue-router'
import {Refresh, Plus, TrendCharts, DataLine} from '@element-plus/icons-vue'

const router = useRouter()

const loading = ref(false)
const refreshing = ref(false)
const autoRefreshing = ref(false)
const addLoading = ref(false)
const tableData = ref([])
const addDialogVisible = ref(false)
const addFormRef = ref()
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
  remark: '',
})

const addRules = reactive({
  stockCode: [{required: true, message: '请输入股票代码', trigger: 'blur'}],
  stockName: [{required: true, message: '请输入股票名称', trigger: 'blur'}],
})

// 获取当前页面所有股票代码
const getStockCodes = () => tableData.value.map(r => r.stockCode).filter(Boolean)

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
  // 如果正在自动刷新，点击则停止
  if (autoRefreshing.value) {
    stopAutoRefresh()
    return
  }

  // 先执行一次刷新
  await doRefresh()

  // 如果选了刷新频率，开启自动刷新
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
    const records = (res.data?.records || []).map(r => ({...r, _editing: false, _remark: r.remark || ''}))
    tableData.value = records
    pagination.total = res.data?.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleRowClick = (row) => {
  router.push({path: '/stock-detail', query: {stockCode: row.stockCode}})
}

const showAddDialog = () => {
  addForm.stockCode = ''
  addForm.stockName = ''
  addForm.remark = ''
  addDialogVisible.value = true
}

const handleAdd = () => {
  addFormRef.value.validate(async (valid) => {
    if (!valid) return
    addLoading.value = true
    try {
      await addWatchlist({stockCode: addForm.stockCode, stockName: addForm.stockName, remark: addForm.remark})
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

const editRemark = (row) => {
  row._editing = true
  row._remark = row.remark || ''
}

const saveRemark = async (row) => {
  if (!row._editing) return
  row._editing = false
  if (row._remark === (row.remark || '')) return
  try {
    await updateWatchlistRemark({id: row.id, remark: row._remark})
    row.remark = row._remark
    ElMessage.success('备注已更新')
  } catch {
    row._remark = row.remark || ''
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

.text-red { color: #f56c6c; }
.text-green { color: #67c23a; }

.pagination-box {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
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
