<template>
  <div class="dashboard" v-loading="loading">
    <!-- 关键指标卡片 -->
    <div class="stats">
      <div class="stat-card" v-for="(s, i) in statCards" :key="i" :style="{ background: s.bg }">
        <div class="stat-emoji">{{ s.emoji }}</div>
        <div class="stat-value">
          {{ s.value }}<span class="stat-unit">{{ s.unit }}</span>
        </div>
        <div class="stat-label">{{ s.label }}</div>
        <div class="stat-sub" v-if="s.sub">{{ s.sub }}</div>
      </div>
    </div>

    <!-- 图表 -->
    <div class="charts">
      <div class="chart-card">
        <div class="chart-title">近 7 天新增用户</div>
        <div ref="usersChartRef" class="chart" />
      </div>
      <div class="chart-card">
        <div class="chart-title">近 7 天营收（元）</div>
        <div ref="revenueChartRef" class="chart" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getDashboard } from '@/api/admin'

const loading = ref(true)
const data = ref({
  users: { total: 0, today: 0, vip: 0 },
  orders: { paid: 0, revenue: 0, todayRevenue: 0 },
  analyses: { total: 0, today: 0 },
  charts: { dailyUsers: [], dailyRevenue: [] }
})

const usersChartRef = ref()
const revenueChartRef = ref()

const statCards = computed(() => [
  {
    emoji: '👥', label: '总用户数', value: data.value.users.total, unit: '',
    sub: `今日新增 +${data.value.users.today}`,
    bg: 'linear-gradient(135deg, #DDD6FE, #8B5CF6)'
  },
  {
    emoji: '👑', label: '会员用户', value: data.value.users.vip, unit: '',
    sub: `占比 ${pct(data.value.users.vip, data.value.users.total)}`,
    bg: 'linear-gradient(135deg, #FBCFE8, #F472B6)'
  },
  {
    emoji: '💰', label: '总营收', value: data.value.orders.revenue.toFixed(2), unit: '元',
    sub: `今日 ¥${data.value.orders.todayRevenue.toFixed(2)}`,
    bg: 'linear-gradient(135deg, #FDE68A, #F59E0B)'
  },
  {
    emoji: '🎨', label: '总分析次数', value: data.value.analyses.total, unit: '',
    sub: `今日 +${data.value.analyses.today}`,
    bg: 'linear-gradient(135deg, #BFDBFE, #3B82F6)'
  }
])

function pct(a, b) {
  if (!b) return '0%'
  return Math.round((a / b) * 100) + '%'
}

const renderUsersChart = () => {
  const dates = generateLast7Days()
  const map = Object.fromEntries(
    data.value.charts.dailyUsers.map((d) => [formatDate(d.date), Number(d.count)])
  )
  const values = dates.map((d) => map[d] || 0)

  const chart = echarts.init(usersChartRef.value)
  chart.setOption({
    grid: { top: 30, right: 20, bottom: 40, left: 50 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#E5E7EB' } } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#F3F4F6' } } },
    series: [{
      type: 'line',
      data: values,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: { color: '#8B5CF6' },
      lineStyle: { width: 3, color: '#8B5CF6' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(139, 92, 246, .3)' },
          { offset: 1, color: 'rgba(139, 92, 246, 0)' }
        ])
      }
    }]
  })
}

const renderRevenueChart = () => {
  const dates = generateLast7Days()
  const map = Object.fromEntries(
    data.value.charts.dailyRevenue.map((d) => [formatDate(d.date), Number(d.revenue)])
  )
  const values = dates.map((d) => map[d] || 0)

  const chart = echarts.init(revenueChartRef.value)
  chart.setOption({
    grid: { top: 30, right: 20, bottom: 40, left: 50 },
    tooltip: { trigger: 'axis', formatter: '{b}<br/>¥ {c}' },
    xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#E5E7EB' } } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#F3F4F6' } } },
    series: [{
      type: 'bar',
      data: values,
      barWidth: '40%',
      itemStyle: {
        borderRadius: [8, 8, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#EC4899' },
          { offset: 1, color: '#8B5CF6' }
        ])
      }
    }]
  })
}

function generateLast7Days() {
  const days = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days.push(formatDate(d))
  }
  return days
}

function formatDate(d) {
  const date = d instanceof Date ? d : new Date(d)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

onMounted(async () => {
  try {
    data.value = await getDashboard()
    await nextTick()
    renderUsersChart()
    renderRevenueChart()
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.dashboard { display: flex; flex-direction: column; gap: 20px; }

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.stat-card {
  padding: 24px;
  border-radius: 16px;
  color: #fff;
  position: relative;
  box-shadow: 0 4px 16px rgba(0,0,0,.08);
}
.stat-emoji { font-size: 32px; margin-bottom: 8px; }
.stat-value {
  font-size: 32px; font-weight: 800; line-height: 1;
}
.stat-unit { font-size: 14px; margin-left: 4px; opacity: .9; }
.stat-label { font-size: 14px; margin-top: 8px; opacity: .9; }
.stat-sub { font-size: 12px; margin-top: 4px; opacity: .85; }

.charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.chart-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.chart-title { font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #1F2937; }
.chart { height: 260px; }
</style>
