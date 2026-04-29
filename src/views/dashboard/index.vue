<template>
  <div class="dashboard">
    <el-row :gutter="24">
      <el-col :span="6" v-for="item in statCards" :key="item.label">
        <el-card shadow="hover" class="stat-card clickable" @click="item.action">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">{{ item.label }}</div>
              <div class="stat-value">{{ item.value }}</div>
            </div>
            <el-icon class="stat-icon" :style="{color: item.color}">
              <component :is="item.icon"/>
            </el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 涨跌幅分布图 -->
    <el-row :gutter="24" style="margin-top: 24px">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-title-row">
              <span class="card-title">涨跌幅分布（点击柱形查看对应股票）</span>
              <div class="up-down-stat">
                <span class="up-stat">😊 涨 {{ upCount }} 家</span>
                <span class="down-stat">😟 跌 {{ downCount }} 家</span>
              </div>
            </div>
          </template>
          <div ref="chartRef" class="distribution-chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24" style="margin-top: 24px">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">行业板块涨幅 TOP10</span>
          </template>
          <el-table :data="topSectors" stripe size="small" max-height="380">
            <el-table-column prop="sectorName" label="板块名称" min-width="140">
              <template #default="{row}">
                <span class="sector-link" @click="goSectorByName(row.sectorName)">{{ row.sectorName }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="changeRate" label="涨跌幅(%)" width="120" align="right">
              <template #default="{row}">
                <span :class="row.changeRate > 0 ? 'text-red' : row.changeRate < 0 ? 'text-green' : ''">
                  {{ row.changeRate > 0 ? '+' : '' }}{{ row.changeRate }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="currentIndex" label="当前指数" width="120" align="right"/>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">行业板块跌幅 TOP10</span>
          </template>
          <el-table :data="bottomSectors" stripe size="small" max-height="380">
            <el-table-column prop="sectorName" label="板块名称" min-width="140">
              <template #default="{row}">
                <span class="sector-link" @click="goSectorByName(row.sectorName)">{{ row.sectorName }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="changeRate" label="涨跌幅(%)" width="120" align="right">
              <template #default="{row}">
                <span :class="row.changeRate > 0 ? 'text-red' : row.changeRate < 0 ? 'text-green' : ''">
                  {{ row.changeRate > 0 ? '+' : '' }}{{ row.changeRate }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="currentIndex" label="当前指数" width="120" align="right"/>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import {getSectorList, getAShareList, getPriceChangeDistribution} from '@/api/modules/api.stock'
import {useRouter} from 'vue-router'

const router = useRouter()
const chartRef = ref(null)
let chartInstance = null

// 涨跌幅区间边界（用于点击柱形时传参跳转）
const changeRanges = [
  {min: null, max: -10},
  {min: -10, max: -8},
  {min: -8, max: -6},
  {min: -6, max: -4},
  {min: -4, max: -2},
  {min: -2, max: 0},
  {min: 0, max: 2},
  {min: 2, max: 4},
  {min: 4, max: 6},
  {min: 6, max: 8},
  {min: 8, max: 10},
  {min: 10, max: null},
]

const statCards = ref([
  {label: '股票总数', value: '-', icon: 'TrendCharts', color: '#409eff',
    action: () => router.push('/stock/list')},
  {label: '行业板块', value: '-', icon: 'DataBoard', color: '#67c23a',
    action: () => router.push({path: '/sector/list', query: {sectorType: 'industry'}})},
  {label: '概念板块', value: '-', icon: 'Collection', color: '#e6a23c',
    action: () => router.push({path: '/sector/list', query: {sectorType: 'concept'}})},
  {label: '地区板块', value: '-', icon: 'Location', color: '#f56c6c',
    action: () => router.push({path: '/sector/list', query: {sectorType: 'area'}})},
])

const topSectors = ref([])
const bottomSectors = ref([])
const upCount = ref(0)
const downCount = ref(0)

// 跳转到板块模块并按名称搜索
const goSectorByName = (sectorName) => {
  router.push({path: '/sector/list', query: {sectorName}})
}

// 跳转到全股模块并按涨跌幅区间查询
const goStockByChangeRange = (rangeIndex) => {
  const range = changeRanges[rangeIndex]
  if (!range) return
  const query = {}
  if (range.min !== null) query.minChange = range.min
  if (range.max !== null) query.maxChange = range.max
  // 第一个区间（≤-10%）：maxChange包含等于
  if (rangeIndex === 0) query.maxChangeInclusive = true
  // 第二个区间（-10%~-8%）：minChange不包含等于（因为-10%归第一个区间）
  if (rangeIndex === 1) query.minChangeInclusive = false
  // 最后一个区间（≥10%）：minChange包含等于
  if (rangeIndex === 11) query.minChangeInclusive = true
  // 分布图包含ST，跳转后也默认包含
  query.includeSt = true
  router.push({path: '/stock/list', query})
}

function renderChart(labels, counts) {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }
  // 柱子颜色：跌的绿色，涨的红色
  const barColors = counts.map((_, i) => {
    if (i < 5) return '#67c23a'
    if (i === 5) return '#95d475'
    if (i === 6) return '#fab6b6'
    return '#f56c6c'
  })

  const maxCount = Math.max(...counts)

  chartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {type: 'shadow'},
      formatter(params) {
        const p = params.find(p => p.seriesName === '数量') || params[0]
        return `${p.name.replace('\n', '')}<br/>股票数量: <b>${p.value}</b>`
      }
    },
    grid: {left: 50, right: 30, top: 30, bottom: 40},
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: {fontSize: 11}
    },
    yAxis: {
      type: 'value',
      name: '股票数量',
      axisLabel: {fontSize: 11}
    },
    series: [
      // 背景柱：铺满整个高度，扩大可点击区域
      {
        name: '背景',
        type: 'bar',
        data: counts.map(() => maxCount * 1.1),
        barMaxWidth: 50,
        itemStyle: {color: 'transparent'},
        silent: true,
        z: 0,
      },
      // 实际数据柱
      {
        name: '数量',
        type: 'bar',
        data: counts.map((v, i) => ({
          value: v,
          itemStyle: {color: barColors[i]}
        })),
        barMaxWidth: 50,
        barGap: '-100%',
        z: 1,
        label: {
          show: true,
          position: 'top',
          fontSize: 11,
          formatter: '{c}'
        }
      }
    ]
  })

  // 点击柱形跳转
  chartInstance.off('click')
  chartInstance.on('click', (params) => {
    if (params.dataIndex !== undefined) {
      goStockByChangeRange(params.dataIndex)
    }
  })
}

onMounted(async () => {
  try {
    const [stockRes, industryRes, conceptRes, areaRes, distRes] = await Promise.all([
      getAShareList({pageNum: 1, pageSize: 1, includeSt: true}),
      getSectorList({pageNum: 1, pageSize: 1, sectorType: 'industry'}),
      getSectorList({pageNum: 1, pageSize: 1, sectorType: 'concept'}),
      getSectorList({pageNum: 1, pageSize: 1, sectorType: 'area'}),
      getPriceChangeDistribution(),
    ])
    statCards.value[0].value = stockRes.data?.total ?? '-'
    statCards.value[1].value = industryRes.data?.total ?? '-'
    statCards.value[2].value = conceptRes.data?.total ?? '-'
    statCards.value[3].value = areaRes.data?.total ?? '-'

    const labels = distRes.data?.labels || []
    const counts = distRes.data?.counts || []
    upCount.value = distRes.data?.upCount || 0
    downCount.value = distRes.data?.downCount || 0
    nextTick(() => renderChart(labels, counts))

    const allRes = await getSectorList({pageNum: 1, pageSize: 500, sectorType: 'industry'})
    const allIndustry = allRes.data?.records || []
    const sorted = [...allIndustry].sort((a, b) => (b.changeRate || 0) - (a.changeRate || 0))
    topSectors.value = sorted.slice(0, 10)
    bottomSectors.value = sorted.slice(-10).reverse()
  } catch (e) {
    console.error('获取仪表盘数据失败', e)
  }

  // 响应窗口大小变化
  window.addEventListener('resize', () => chartInstance?.resize())
})

onBeforeUnmount(() => {
  chartInstance?.dispose()
  window.removeEventListener('resize', () => chartInstance?.resize())
})
</script>

<style lang="scss" scoped>
.stat-card.clickable {
  cursor: pointer;
  transition: transform 0.15s;
  &:hover {
    transform: translateY(-2px);
  }
}

.stat-card {
  .stat-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .stat-info {
      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-bottom: 10px;
      }

      .stat-value {
        font-size: 30px;
        font-weight: bold;
        color: #303133;
      }
    }

    .stat-icon {
      font-size: 50px;
      opacity: 0.7;
    }
  }
}

.card-title {
  font-size: 15px;
  font-weight: 600;
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.up-down-stat {
  display: flex;
  gap: 20px;
  font-size: 15px;
  font-weight: 600;
  .up-stat { color: #f56c6c; }
  .down-stat { color: #67c23a; }
}

.distribution-chart {
  width: 100%;
  height: 350px;
}

.text-red {
  color: #f56c6c;
  font-weight: bold;
}

.text-green {
  color: #67c23a;
  font-weight: bold;
}

.sector-link {
  color: #409eff;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
}
</style>
