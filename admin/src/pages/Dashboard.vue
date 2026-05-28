<template>
  <div class="dashboard">
    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" class="dashboard-tabs">
      <el-tab-pane label="📊 概览" name="overview" />
      <el-tab-pane label="🔻 转化漏斗" name="funnel" />
      <el-tab-pane label="📅 留存分析" name="retention" />
      <el-tab-pane label="🥧 用户分布" name="distribution" />
    </el-tabs>

    <!-- 时间范围选择 -->
    <div class="filter-bar" v-if="activeTab !== 'overview'">
      <span class="filter-label">时间范围：</span>
      <el-radio-group v-model="dateRange" @change="onRangeChange" size="small">
        <el-radio-button :value="7">近 7 天</el-radio-button>
        <el-radio-button :value="30">近 30 天</el-radio-button>
        <el-radio-button :value="90">近 90 天</el-radio-button>
      </el-radio-group>
    </div>

    <!-- ============ Tab 1: 概览 ============ -->
    <div v-show="activeTab === 'overview'" v-loading="loading.overview" class="tab-pane">
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

    <!-- ============ Tab 2: 转化漏斗 ============ -->
    <div v-show="activeTab === 'funnel'" v-loading="loading.funnel" class="tab-pane">
      <!-- 漏斗图 -->
      <div class="chart-card">
        <div class="chart-title">用户转化漏斗（近 {{ dateRange }} 天）</div>
        <div ref="funnelChartRef" class="chart-large" />
        <div class="funnel-stages" v-if="funnel.stages.length > 0">
          <div
            v-for="(stage, i) in funnel.stages"
            :key="i"
            class="funnel-stage-row"
          >
            <div class="stage-name">{{ stage.name }}</div>
            <div class="stage-count">{{ stage.count }}</div>
            <div class="stage-rate" :style="{ color: stage.color }">
              {{ i === 0 ? '基准' : `${stage.conversionRate}% 转化` }}
            </div>
            <div v-if="i > 0 && stage.dropoff > 0" class="stage-dropoff">
              ↓ 流失 {{ stage.dropoff }} 人
            </div>
          </div>
        </div>
      </div>

      <!-- 收入核心指标 -->
      <div class="revenue-cards" v-if="revenueMetrics">
        <div class="rev-card" v-for="(m, i) in revenueCards" :key="i">
          <div class="rev-emoji">{{ m.emoji }}</div>
          <div class="rev-value">
            {{ m.value }}<span class="rev-unit">{{ m.unit }}</span>
          </div>
          <div class="rev-label">{{ m.label }}</div>
          <div class="rev-tooltip">{{ m.tip }}</div>
        </div>
      </div>

      <!-- 套餐 + 支付方式 分布 -->
      <div class="charts">
        <div class="chart-card">
          <div class="chart-title">套餐分布</div>
          <div ref="planChartRef" class="chart" />
        </div>
        <div class="chart-card">
          <div class="chart-title">支付方式</div>
          <div ref="payMethodChartRef" class="chart" />
        </div>
      </div>
    </div>

    <!-- ============ Tab 3: 留存分析 ============ -->
    <div v-show="activeTab === 'retention'" v-loading="loading.retention" class="tab-pane">
      <div class="chart-card">
        <div class="chart-title">
          按周分组的留存矩阵
          <span class="chart-subtitle">越深说明留存率越高</span>
        </div>

        <div class="retention-table" v-if="retention.matrix.length > 0">
          <div class="ret-row ret-header">
            <div class="ret-cohort">注册周</div>
            <div class="ret-size">规模</div>
            <div class="ret-cell">D0 当天</div>
            <div class="ret-cell">D1-6</div>
            <div class="ret-cell">D7-29</div>
            <div class="ret-cell">D30+</div>
          </div>
          <div v-for="(row, i) in retention.matrix" :key="i" class="ret-row">
            <div class="ret-cohort">{{ formatCohort(row.cohort) }}</div>
            <div class="ret-size">{{ row.size }}</div>
            <div class="ret-cell" :style="cellStyle(row.d0)">{{ row.d0 }}%</div>
            <div class="ret-cell" :style="cellStyle(row.d1_6)">{{ row.d1_6 }}%</div>
            <div class="ret-cell" :style="cellStyle(row.d7_29)">{{ row.d7_29 }}%</div>
            <div class="ret-cell" :style="cellStyle(row.d30_plus)">{{ row.d30_plus }}%</div>
          </div>
        </div>

        <el-empty v-else description="暂无数据" />
      </div>

      <div class="explain-card">
        <div class="explain-title">📖 怎么看留存矩阵</div>
        <ul>
          <li><b>D0 当天</b>：注册当天就完成分析的用户占比（理想 &gt; 60%）</li>
          <li><b>D1-6</b>：注册后 1~6 天内仍有活跃的用户占比（理想 &gt; 30%）</li>
          <li><b>D7-29</b>：第 1~4 周内活跃（中长期用户）</li>
          <li><b>D30+</b>：30 天后还在用（铁粉，最有价值）</li>
        </ul>
      </div>
    </div>

    <!-- ============ Tab 4: 用户分布 ============ -->
    <div v-show="activeTab === 'distribution'" v-loading="loading.distribution" class="tab-pane">
      <div class="charts">
        <div class="chart-card">
          <div class="chart-title">脸型分布</div>
          <div ref="faceShapeChartRef" class="chart" />
        </div>
        <div class="chart-card">
          <div class="chart-title">色彩季型分布</div>
          <div ref="skinToneChartRef" class="chart" />
        </div>
      </div>
      <div class="charts">
        <div class="chart-card">
          <div class="chart-title">AI 妆容偏好</div>
          <div ref="makeupStyleChartRef" class="chart" />
        </div>
        <div class="chart-card">
          <div class="chart-title">24 小时活跃度</div>
          <div ref="hourlyChartRef" class="chart" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import {
  getDashboard, getFunnel, getRetention,
  getRevenueMetrics, getDistribution
} from '@/api/admin'

const activeTab = ref('overview')
const dateRange = ref(30)

const loading = reactive({
  overview: false,
  funnel: false,
  retention: false,
  distribution: false
})

// ============ 概览数据 ============
const overview = ref({
  users: { total: 0, today: 0, vip: 0 },
  orders: { paid: 0, revenue: 0, todayRevenue: 0 },
  analyses: { total: 0, today: 0 },
  charts: { dailyUsers: [], dailyRevenue: [] }
})
const usersChartRef = ref()
const revenueChartRef = ref()

const statCards = computed(() => [
  {
    emoji: '👥', label: '总用户数', value: overview.value.users.total, unit: '',
    sub: `今日新增 +${overview.value.users.today}`,
    bg: 'linear-gradient(135deg, #DDD6FE, #8B5CF6)'
  },
  {
    emoji: '👑', label: '会员用户', value: overview.value.users.vip, unit: '',
    sub: `占比 ${pct(overview.value.users.vip, overview.value.users.total)}`,
    bg: 'linear-gradient(135deg, #FBCFE8, #F472B6)'
  },
  {
    emoji: '💰', label: '总营收', value: overview.value.orders.revenue.toFixed(2), unit: '元',
    sub: `今日 ¥${overview.value.orders.todayRevenue.toFixed(2)}`,
    bg: 'linear-gradient(135deg, #FDE68A, #F59E0B)'
  },
  {
    emoji: '🎨', label: '总分析次数', value: overview.value.analyses.total, unit: '',
    sub: `今日 +${overview.value.analyses.today}`,
    bg: 'linear-gradient(135deg, #BFDBFE, #3B82F6)'
  }
])

function pct(a, b) {
  if (!b) return '0%'
  return Math.round((a / b) * 100) + '%'
}

// ============ 漏斗 + 收入指标 ============
const funnel = ref({ stages: [] })
const revenueMetrics = ref(null)
const funnelChartRef = ref()
const planChartRef = ref()
const payMethodChartRef = ref()

const revenueCards = computed(() => {
  if (!revenueMetrics.value) return []
  const m = revenueMetrics.value
  return [
    {
      emoji: '💸', label: '总营收', value: m.totalRevenue.toLocaleString(), unit: ' 元',
      tip: '所有付费订单累计金额'
    },
    {
      emoji: '📊', label: '付费转化率', value: m.conversionRate, unit: ' %',
      tip: '付费用户 / 总用户'
    },
    {
      emoji: '👤', label: 'ARPU', value: m.arpu, unit: ' 元',
      tip: '每用户平均收入 = 总营收 / 总用户'
    },
    {
      emoji: '💎', label: 'ARPPU', value: m.arppu, unit: ' 元',
      tip: '每付费用户平均收入'
    },
    {
      emoji: '⭐', label: 'LTV', value: m.ltv, unit: ' 元',
      tip: '用户终身价值（估算续订 1.7 周期）'
    }
  ]
})

// ============ 留存矩阵 ============
const retention = ref({ matrix: [] })

function formatCohort(date) {
  if (!date) return ''
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}`
}

/**
 * 留存率 → 背景色（紫色深浅）
 * 0% → 透明  50% → 中紫  100% → 深紫
 */
function cellStyle(rate) {
  const r = Math.max(0, Math.min(100, rate))
  // 透明度从 0.05 到 0.85 之间
  const alpha = 0.05 + (r / 100) * 0.8
  const txtColor = r > 50 ? '#fff' : '#1F2937'
  return {
    background: `rgba(139, 92, 246, ${alpha})`,
    color: txtColor,
    fontWeight: r > 30 ? 700 : 500
  }
}

// ============ 用户分布 ============
const distribution = ref({
  faceShapes: [], skinTones: [], makeupStyles: [], hourlyActivity: []
})
const faceShapeChartRef = ref()
const skinToneChartRef = ref()
const makeupStyleChartRef = ref()
const hourlyChartRef = ref()

// ============ 加载方法 ============
const loadOverview = async () => {
  loading.overview = true
  try {
    overview.value = await getDashboard()
    await nextTick()
    renderUsersChart()
    renderRevenueChart()
  } finally { loading.overview = false }
}

const loadFunnel = async () => {
  loading.funnel = true
  try {
    const [f, r] = await Promise.all([
      getFunnel(dateRange.value),
      getRevenueMetrics()
    ])
    funnel.value = f
    revenueMetrics.value = r
    await nextTick()
    renderFunnelChart()
    renderPlanChart()
    renderPayMethodChart()
  } finally { loading.funnel = false }
}

const loadRetention = async () => {
  loading.retention = true
  try {
    const weeks = Math.max(2, Math.ceil(dateRange.value / 7))
    retention.value = await getRetention(Math.min(16, weeks))
  } finally { loading.retention = false }
}

const loadDistribution = async () => {
  loading.distribution = true
  try {
    distribution.value = await getDistribution(dateRange.value)
    await nextTick()
    renderFaceShapeChart()
    renderSkinToneChart()
    renderMakeupStyleChart()
    renderHourlyChart()
  } finally { loading.distribution = false }
}

const onRangeChange = () => {
  if (activeTab.value === 'funnel') loadFunnel()
  else if (activeTab.value === 'retention') loadRetention()
  else if (activeTab.value === 'distribution') loadDistribution()
}

watch(activeTab, async (tab) => {
  if (tab === 'overview' && !overview.value.users.total) await loadOverview()
  else if (tab === 'funnel' && funnel.value.stages.length === 0) await loadFunnel()
  else if (tab === 'retention' && retention.value.matrix.length === 0) await loadRetention()
  else if (tab === 'distribution' && distribution.value.faceShapes.length === 0) await loadDistribution()
})

// ============ 图表渲染 ============

function renderUsersChart() {
  const dates = generateLast7Days()
  const map = Object.fromEntries(
    overview.value.charts.dailyUsers.map((d) => [formatDate(d.date), Number(d.count)])
  )
  const values = dates.map((d) => map[d] || 0)

  echarts.init(usersChartRef.value).setOption({
    grid: { top: 30, right: 20, bottom: 40, left: 50 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#E5E7EB' } } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#F3F4F6' } } },
    series: [{
      type: 'line', data: values, smooth: true, symbol: 'circle', symbolSize: 8,
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

function renderRevenueChart() {
  const dates = generateLast7Days()
  const map = Object.fromEntries(
    overview.value.charts.dailyRevenue.map((d) => [formatDate(d.date), Number(d.revenue)])
  )
  const values = dates.map((d) => map[d] || 0)

  echarts.init(revenueChartRef.value).setOption({
    grid: { top: 30, right: 20, bottom: 40, left: 50 },
    tooltip: { trigger: 'axis', formatter: '{b}<br/>¥ {c}' },
    xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#E5E7EB' } } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#F3F4F6' } } },
    series: [{
      type: 'bar', data: values, barWidth: '40%',
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

function renderFunnelChart() {
  const stages = funnel.value.stages
  if (!stages.length) return

  echarts.init(funnelChartRef.value).setOption({
    tooltip: {
      trigger: 'item',
      formatter: (p) => {
        const s = stages[stages.length - 1 - stages.findIndex(x => x.name === p.name)]
          || stages.find(x => x.name === p.name)
        return `${p.name}<br/>用户数：${p.value}<br/>转化率：${s?.conversionRate || 0}%`
      }
    },
    series: [{
      type: 'funnel',
      left: '15%',
      right: '15%',
      top: 30,
      bottom: 30,
      sort: 'descending',
      gap: 4,
      label: {
        show: true,
        position: 'inside',
        fontSize: 16,
        fontWeight: 700,
        color: '#fff',
        formatter: (p) => `${p.name}\n${p.value}`
      },
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      data: stages.map((s) => ({
        name: s.name,
        value: s.count,
        itemStyle: { color: s.color }
      }))
    }]
  })
}

function renderPlanChart() {
  const data = revenueMetrics.value?.planRevenue || []
  if (!data.length) {
    echarts.init(planChartRef.value).setOption({
      title: { text: '暂无数据', left: 'center', top: 'middle', textStyle: { color: '#9CA3AF' } }
    })
    return
  }
  const labelMap = { month: '月度', quarter: '季度', year: '年度' }
  echarts.init(planChartRef.value).setOption({
    tooltip: { trigger: 'item', formatter: '{b}<br/>¥{c} ({d}%)' },
    legend: { bottom: 10, icon: 'circle' },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      label: { show: true, formatter: '{b}\n¥{c}' },
      data: data.map((d) => ({
        name: labelMap[d.plan] || d.plan,
        value: d.revenue
      })),
      color: ['#8B5CF6', '#EC4899', '#F59E0B']
    }]
  })
}

function renderPayMethodChart() {
  const data = revenueMetrics.value?.payMethodRevenue || []
  if (!data.length) {
    echarts.init(payMethodChartRef.value).setOption({
      title: { text: '暂无数据', left: 'center', top: 'middle', textStyle: { color: '#9CA3AF' } }
    })
    return
  }
  const labelMap = { wechat: '💚 微信', alipay: '💙 支付宝', apple_iap: '🍎 Apple' }
  echarts.init(payMethodChartRef.value).setOption({
    tooltip: { trigger: 'item', formatter: '{b}<br/>¥{c} ({d}%)' },
    legend: { bottom: 10, icon: 'circle' },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      data: data.map((d) => ({
        name: labelMap[d.pay_method] || d.pay_method,
        value: d.revenue
      })),
      color: ['#10B981', '#3B82F6', '#1F2937']
    }]
  })
}

function renderFaceShapeChart() {
  echarts.init(faceShapeChartRef.value).setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 10, icon: 'circle', textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['38%', '62%'],
      center: ['50%', '45%'],
      label: { show: true, formatter: '{b}\n{d}%' },
      data: distribution.value.faceShapes,
      color: ['#8B5CF6', '#EC4899', '#F59E0B', '#3B82F6', '#10B981', '#F43F5E']
    }]
  })
}

function renderSkinToneChart() {
  echarts.init(skinToneChartRef.value).setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 10, icon: 'circle', textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['38%', '62%'],
      center: ['50%', '45%'],
      label: { show: true, formatter: '{b}\n{d}%' },
      data: distribution.value.skinTones,
      color: ['#FDE68A', '#A78BFA', '#A0522D', '#1E3A8A']
    }]
  })
}

function renderMakeupStyleChart() {
  const labelMap = {
    daily: '☀️ 日常通勤', date: '💗 约会甜心',
    retro: '🌹 复古港风', cool: '❄️ 清冷御姐'
  }
  const data = distribution.value.makeupStyles.map((d) => ({
    name: labelMap[d.name] || d.name,
    value: d.value
  }))

  if (!data.length) {
    echarts.init(makeupStyleChartRef.value).setOption({
      title: { text: '暂无数据', left: 'center', top: 'middle', textStyle: { color: '#9CA3AF' } }
    })
    return
  }

  echarts.init(makeupStyleChartRef.value).setOption({
    tooltip: { trigger: 'axis' },
    grid: { top: 30, right: 30, bottom: 30, left: 100 },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: '#F3F4F6' } } },
    yAxis: { type: 'category', data: data.map((d) => d.name), axisLine: { show: false } },
    series: [{
      type: 'bar',
      data: data.map((d) => d.value),
      barWidth: '50%',
      itemStyle: {
        borderRadius: [0, 8, 8, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#8B5CF6' },
          { offset: 1, color: '#EC4899' }
        ])
      },
      label: { show: true, position: 'right' }
    }]
  })
}

function renderHourlyChart() {
  const data = distribution.value.hourlyActivity
  echarts.init(hourlyChartRef.value).setOption({
    tooltip: { trigger: 'axis', formatter: '{b}时<br/>分析 {c} 次' },
    grid: { top: 30, right: 20, bottom: 40, left: 50 },
    xAxis: {
      type: 'category',
      data: data.map((d) => `${d.hour}时`),
      axisLine: { lineStyle: { color: '#E5E7EB' } }
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#F3F4F6' } } },
    series: [{
      type: 'bar',
      data: data.map((d) => d.count),
      barWidth: '60%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: (p) => {
          const ratio = p.value / Math.max(...data.map((d) => d.count), 1)
          return new echarts.graphic.LinearGradient(0, 1, 0, 0, [
            { offset: 0, color: '#C4B5FD' },
            { offset: 1, color: ratio > 0.6 ? '#EC4899' : '#8B5CF6' }
          ])
        }
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

onMounted(loadOverview)
</script>

<style lang="scss" scoped>
.dashboard { display: flex; flex-direction: column; gap: 16px; }

.dashboard-tabs {
  background: #fff;
  border-radius: 12px;
  padding: 0 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
:deep(.el-tabs__nav-wrap::after) { display: none; }
:deep(.el-tabs__item) { font-size: 15px; font-weight: 600; }

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 4px;
}
.filter-label { color: #6B7280; font-size: 14px; }

.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 400px;
}

/* 概览：指标卡 */
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
.stat-value { font-size: 32px; font-weight: 800; line-height: 1; }
.stat-unit { font-size: 14px; margin-left: 4px; opacity: .9; }
.stat-label { font-size: 14px; margin-top: 8px; opacity: .9; }
.stat-sub { font-size: 12px; margin-top: 4px; opacity: .85; }

/* 通用图表卡片 */
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
.chart-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #1F2937;
  display: flex;
  align-items: center;
  gap: 12px;
}
.chart-subtitle { font-size: 12px; color: #9CA3AF; font-weight: 400; }
.chart { height: 260px; }
.chart-large { height: 360px; }

/* 漏斗：阶段详情 */
.funnel-stages {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #F3F4F6;
}
.funnel-stage-row {
  display: grid;
  grid-template-columns: 1fr 100px 120px 120px;
  gap: 16px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #F9FAFB;
}
.funnel-stage-row:last-child { border-bottom: none; }
.stage-name { font-weight: 600; color: #1F2937; }
.stage-count { font-size: 18px; font-weight: 700; color: #1F2937; }
.stage-rate { font-weight: 600; }
.stage-dropoff { color: #DC2626; font-size: 13px; }

/* 收入指标卡 */
.revenue-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}
.rev-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  text-align: center;
}
.rev-emoji { font-size: 32px; margin-bottom: 8px; }
.rev-value {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, #8B5CF6, #EC4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.rev-unit { font-size: 14px; color: #6B7280; -webkit-text-fill-color: #6B7280; margin-left: 2px; }
.rev-label {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
  margin-top: 6px;
}
.rev-tooltip {
  font-size: 11px;
  color: #9CA3AF;
  margin-top: 4px;
  line-height: 1.4;
}

/* 留存矩阵 */
.retention-table {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 12px;
}
.ret-row {
  display: grid;
  grid-template-columns: 140px 80px 1fr 1fr 1fr 1fr;
  gap: 4px;
  align-items: center;
}
.ret-row.ret-header {
  font-weight: 700;
  color: #6B7280;
  font-size: 13px;
  margin-bottom: 4px;
}
.ret-cohort {
  padding: 12px 16px;
  background: #F9FAFB;
  border-radius: 8px;
  font-size: 13px;
  color: #1F2937;
}
.ret-size {
  text-align: center;
  padding: 12px 0;
  background: #F3F4F6;
  border-radius: 8px;
  font-weight: 600;
  color: #6B7280;
}
.ret-cell {
  text-align: center;
  padding: 12px 0;
  border-radius: 8px;
  font-size: 14px;
  transition: transform .2s;
}
.ret-cell:hover { transform: scale(1.05); }

.explain-card {
  background: linear-gradient(135deg, #F5F3FF, #FDF2F8);
  border-radius: 12px;
  padding: 20px 24px;
  font-size: 13px;
  color: #4B5563;
  line-height: 1.8;
}
.explain-title { font-size: 15px; font-weight: 700; color: #1F2937; margin-bottom: 12px; }
.explain-card ul { padding-left: 20px; }
.explain-card li { margin-bottom: 4px; }
</style>
