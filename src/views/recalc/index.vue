<template>
  <div class="recalc-page">
    <el-card shadow="never">
      <template #header>
        <span class="page-title">重计算模块</span>
      </template>
      <el-alert
        title="重计算说明"
        type="info"
        description="此模块用于重新计算各类指标数据。同一时间只能执行一个任务，点击按钮触发后端异步执行，可在下方实时查看执行进度。"
        show-icon
        :closable="false"
        style="margin-bottom: 28px"
      />

      <el-row :gutter="24">
        <el-col :span="12">
          <el-card shadow="hover" class="recalc-card">
            <template #header>
              <div class="card-header">
                <el-icon size="20"><DataBoard/></el-icon>
                <span>板块指数重计算</span>
              </div>
            </template>
            <p>重新计算所有板块的指数指标，包括当前指数、年/月最高最低指数、涨跌幅等。</p>
            <p class="sub-text">数据来源：从 t_a_share_stock 股票表聚合计算，概念/地区板块从新浪财经API获取实时涨跌幅</p>
            <el-button type="primary" @click="recalc('sector')" :loading="loadingMap.sector" :disabled="btnDisabled"
                       style="margin-top: 20px" :icon="Refresh">
              执行板块指数重计算
            </el-button>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="hover" class="recalc-card">
            <template #header>
              <div class="card-header">
                <el-icon size="20"><TrendCharts/></el-icon>
                <span>股票数据刷新</span>
              </div>
            </template>
            <p>从新浪财经拉取全量A股行情数据，并同步计算RSI30和量比指标。</p>
            <p class="sub-text">包含：价格、涨跌幅、换手率、RSI30(Wilder平滑法)、量比(当日/5日均量)</p>
            <el-button type="warning" @click="recalc('stock')" :loading="loadingMap.stock" :disabled="btnDisabled"
                       style="margin-top: 20px" :icon="Download">
              执行股票数据刷新
            </el-button>
          </el-card>
        </el-col>
      </el-row>

      <!-- 任务进度面板 -->
      <el-card shadow="hover" style="margin-top: 28px">
        <template #header>
          <div class="card-header">
            <span>任务进度</span>
            <el-button text size="small" @click="refreshStatus" :loading="refreshing">
              <el-icon><RefreshRight/></el-icon> 刷新
            </el-button>
          </div>
        </template>
        <!-- 无任务时 -->
        <div v-if="hasNoTasks" class="empty-hint">暂无任务记录，点击上方按钮启动重计算</div>
        <!-- 有运行中的任务时，只显示该任务 -->
        <div v-else-if="currentRunning" class="task-item">
          <div class="task-header">
            <span class="task-name">{{ nameMap[currentRunning] }}</span>
            <el-tag type="warning" size="small" effect="dark">执行中</el-tag>
          </div>
          <el-progress
            :percentage="taskStatus[currentRunning].progress || 0"
            :stroke-width="20"
            :text-inside="true"
            style="margin: 10px 0"
          />
          <div class="task-message">{{ taskStatus[currentRunning].progressMessage || taskStatus[currentRunning].message || '准备中...' }}</div>
        </div>
        <!-- 没有运行中的任务时，显示最近完成的任务 -->
        <div v-else>
          <div v-for="type in ['sector', 'stock']" :key="type" class="task-item" v-if="taskStatus[type]">
            <div class="task-header">
              <span class="task-name">{{ nameMap[type] }}</span>
              <el-tag :type="statusTagType(taskStatus[type].status)" size="small" effect="dark">
                {{ statusText(taskStatus[type].status) }}
              </el-tag>
            </div>
            <el-progress
              :percentage="taskStatus[type].progress || 0"
              :status="progressStatus(taskStatus[type].status)"
              :stroke-width="18"
              :text-inside="true"
              style="margin: 8px 0"
            />
            <div class="task-message">{{ taskStatus[type].progressMessage || taskStatus[type].message || '-' }}</div>
          </div>
        </div>
      </el-card>

      <!-- 执行日志 -->
      <el-card shadow="hover" style="margin-top: 20px" v-if="logs.length > 0">
        <template #header><span>执行日志</span></template>
        <div class="log-box">
          <div v-for="(log, index) in logs" :key="index" class="log-item">
            <el-icon :color="log.type === 'success' ? '#67c23a' : log.type === 'error' ? '#f56c6c' : '#409eff'">
              <component :is="log.type === 'success' ? 'SuccessFilled' : log.type === 'error' ? 'CircleCloseFilled' : 'InfoFilled'"/>
            </el-icon>
            <span class="log-time">{{ log.time }}</span>
            <span :class="`log-${log.type}`">{{ log.message }}</span>
          </div>
        </div>
      </el-card>
    </el-card>
  </div>
</template>

<script setup>
import { Refresh, Download, DataBoard, TrendCharts, RefreshRight } from '@element-plus/icons-vue'
import service from '@/api/server'

const loadingMap = reactive({ sector: false, stock: false })
const logs = ref([])
const taskStatus = reactive({})
const refreshing = ref(false)
const initializing = ref(true)
let pollTimer = null

const nameMap = { sector: '板块指数重计算', stock: '股票数据刷新' }

const hasNoTasks = computed(() => !taskStatus.sector && !taskStatus.stock)

// 当前正在运行的任务类型
const currentRunning = computed(() => {
  return ['sector', 'stock'].find(t => taskStatus[t]?.status === 'running') || null
})

// 是否有任何任务在运行（用于禁用所有按钮）
const anyRunning = computed(() => !!currentRunning.value)

// 按钮是否禁用：初始化中或有任务在运行时禁用
const btnDisabled = computed(() => initializing.value || anyRunning.value)

const statusText = (status) => {
  const map = { running: '执行中', success: '已完成', failed: '失败' }
  return map[status] || status || '未知'
}

const statusTagType = (status) => {
  const map = { running: 'warning', success: 'success', failed: 'danger' }
  return map[status] || 'info'
}

const progressStatus = (status) => {
  if (status === 'success') return 'success'
  if (status === 'failed') return 'exception'
  return undefined
}

const addLog = (message, type = 'info') => {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  logs.value.unshift({ time, message, type })
}

const refreshStatus = async () => {
  refreshing.value = true
  try {
    const res = await service.get('/stock/stock/recalc/status')
    if (res.data) {
      Object.keys(res.data).forEach(key => {
        const newData = res.data[key]
        if (taskStatus[key]) {
          Object.keys(newData).forEach(field => {
            taskStatus[key][field] = newData[field]
          })
        } else {
          taskStatus[key] = newData
        }
      })
    }
  } catch (e) {
    // ignore
  } finally {
    refreshing.value = false
  }
}

const startPolling = () => {
  stopPolling()
  pollTimer = setInterval(() => {
    refreshStatus()
  }, 5000)
}

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// 检查是否还有运行中的任务
const checkPolling = () => {
  if (anyRunning.value) {
    startPolling()
  } else {
    stopPolling()
  }
}

// 记录上一次的状态，用于检测 running -> 非 running 的变化
const prevStatusMap = reactive({})

const recalc = async (type) => {
  if (btnDisabled.value) return
  loadingMap[type] = true
  taskStatus[type] = { status: 'running', message: nameMap[type] + '启动中...', progress: 0 }
  prevStatusMap[type] = 'running'
  addLog(`开始执行${nameMap[type]}...`)
  try {
    const res = await service.post(`/stock/stock/recalc/${type}`)
    if (res.data?.success) {
      addLog(`${nameMap[type]}已提交，后台执行中...`, 'success')
      await refreshStatus()
      checkPolling()
    } else {
      addLog(`${nameMap[type]}启动失败: ${res.data?.message || '未知错误'}`, 'error')
      delete taskStatus[type]
      loadingMap[type] = false
    }
  } catch (e) {
    addLog(`${nameMap[type]}启动失败，请检查后端服务是否运行`, 'error')
    delete taskStatus[type]
    loadingMap[type] = false
  }
}

// 监听状态变化，任务完成时记录日志、重置按钮
watch(taskStatus, (newVal) => {
  Object.keys(newVal).forEach(key => {
    const curr = newVal[key]
    const prevStatus = prevStatusMap[key]
    if (curr && prevStatus === 'running' && curr.status !== 'running') {
      if (curr.status === 'success') {
        addLog(`${nameMap[key] || key}执行完成`, 'success')
      } else {
        addLog(`${nameMap[key] || key}执行失败: ${curr.message || '未知错误'}`, 'error')
      }
      loadingMap[key] = false
      checkPolling()
    }
    if (curr) {
      prevStatusMap[key] = curr.status
    }
  })
}, { deep: true })

// 页面加载时获取一次状态，如果有运行中的任务则自动开启轮询
onMounted(async () => {
  await refreshStatus()
  Object.keys(taskStatus).forEach(key => {
    prevStatusMap[key] = taskStatus[key]?.status
  })
  initializing.value = false
  checkPolling()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style lang="scss" scoped>
.page-title {
  font-size: 16px;
  font-weight: 600;
}

.recalc-card {
  .card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: bold;
  }

  p {
    font-size: 14px;
    color: #606266;
    line-height: 1.8;
  }

  .sub-text {
    color: #909399;
    font-size: 13px;
    margin-top: 8px;
  }
}

.task-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  .task-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;

    .task-name {
      font-weight: 600;
      font-size: 14px;
    }
  }

  .task-message {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
}

.empty-hint {
  text-align: center;
  color: #c0c4cc;
  padding: 20px 0;
  font-size: 14px;
}

.log-box {
  max-height: 300px;
  overflow-y: auto;

  .log-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
    font-size: 13px;

    .log-time {
      color: #909399;
      font-family: monospace;
    }

    .log-success { color: #67c23a; }
    .log-error { color: #f56c6c; }
    .log-info { color: #409eff; }
  }
}
</style>
