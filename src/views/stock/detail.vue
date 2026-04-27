<template>
  <div class="stock-detail">
    <el-page-header @back="goBack" :content="`${stockInfo.stockName} (${stockInfo.stockCode})`">
      <template #extra>
        <el-button type="warning" :icon="Star" @click="addToWatchlist" v-if="stockInfo.stockCode">加自选</el-button>
      </template>
    </el-page-header>
    <div v-loading="loading" style="margin-top: 20px">
      <template v-if="stockInfo.stockCode">
        <!-- 基本信息 -->
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header><span>基本信息</span></template>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="股票代码">{{ stockInfo.stockCode }}</el-descriptions-item>
                <el-descriptions-item label="股票名称">{{ stockInfo.stockName }}</el-descriptions-item>
                <el-descriptions-item label="所属市场">
                  <el-tag :type="stockInfo.exchange === 'SH' ? 'danger' : 'primary'" size="small">
                    {{ stockInfo.exchange === 'SH' ? '上海' : '深圳' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="所属板块">{{ stockInfo.sectorName }}</el-descriptions-item>
                <el-descriptions-item label="交易日期">{{ stockInfo.tradeDate }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header><span>价格信息</span></template>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="当前价格">
                  <span class="price">{{ stockInfo.currentPrice }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="涨跌额">
                  <span :class="priceClass(stockInfo.priceChange)">
                    {{ stockInfo.priceChange > 0 ? '+' : '' }}{{ stockInfo.priceChange }}
                  </span>
                </el-descriptions-item>
                <el-descriptions-item label="涨跌幅(%)">
                  <span :class="priceClass(stockInfo.priceChangePercent)">
                    {{ stockInfo.priceChangePercent > 0 ? '+' : '' }}{{ stockInfo.priceChangePercent }}
                  </span>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header><span>区间价格</span></template>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="年内最高">{{ stockInfo.yearHighPrice }}</el-descriptions-item>
                <el-descriptions-item label="年内最低">{{ stockInfo.yearLowPrice }}</el-descriptions-item>
                <el-descriptions-item label="月内最高">{{ stockInfo.monthHighPrice }}</el-descriptions-item>
                <el-descriptions-item label="月内最低">{{ stockInfo.monthLowPrice }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header><span>技术指标</span></template>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="RSI30">{{ stockInfo.rsi30 }}</el-descriptions-item>
                <el-descriptions-item label="换手率(%)">{{ stockInfo.turnoverRate }}</el-descriptions-item>
                <el-descriptions-item label="量比">{{ stockInfo.volumeRatio }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <template #header><span>消息面</span></template>
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="近期利空">
                  <el-tag :type="stockInfo.hasNegativeNews === 1 ? 'danger' : 'success'" size="small">
                    {{ stockInfo.hasNegativeNews === 1 ? '有' : '无' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="近期利好">
                  <el-tag :type="stockInfo.hasPositiveNews === 1 ? 'success' : 'info'" size="small">
                    {{ stockInfo.hasPositiveNews === 1 ? '有' : '无' }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
        </el-row>
      </template>
    </div>
  </div>
</template>

<script setup>
import {getAShareList, addWatchlist} from '@/api/modules/api.stock'
import {useRoute, useRouter} from 'vue-router'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const stockInfo = ref({})

const goBack = () => {
  router.back()
}

const addToWatchlist = async () => {
  try {
    await addWatchlist({stockCode: stockInfo.value.stockCode, stockName: stockInfo.value.stockName})
    ElMessage.success(`${stockInfo.value.stockName} 已加入自选`)
  } catch {
    ElMessage.warning('添加失败，可能已在自选股中')
  }
}

const priceClass = (val) => {
  if (val > 0) return 'text-red'
  if (val < 0) return 'text-green'
  return ''
}

const fetchStock = async (stockCode) => {
  if (!stockCode) return
  loading.value = true
  try {
    const res = await getAShareList({pageNum: 1, pageSize: 1, stockCode, includeSt: true})
    const records = res.data?.records || []
    if (records.length > 0) {
      stockInfo.value = records[0]
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchStock(route.query.stockCode))

// keep-alive 缓存后，路由参数变化时需要重新加载数据
watch(() => route.query.stockCode, (newCode) => {
  if (newCode) fetchStock(newCode)
})
</script>

<style lang="scss" scoped>
.price {
  font-size: 24px;
  font-weight: bold;
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
