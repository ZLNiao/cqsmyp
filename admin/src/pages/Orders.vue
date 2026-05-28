<template>
  <div class="page-card">
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="订单号/手机号"
        style="width: 240px"
        clearable
        @keyup.enter="reload"
        @clear="reload"
      />
      <el-select v-model="status" placeholder="状态" clearable style="width: 140px" @change="reload">
        <el-option label="待支付" value="pending" />
        <el-option label="已支付" value="paid" />
        <el-option label="已退款" value="refunded" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
      <el-button type="primary" @click="reload">查询</el-button>
      <span class="total">共 {{ total }} 条</span>
    </div>

    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column prop="order_no" label="订单号" width="220" />
      <el-table-column label="用户" width="200">
        <template #default="{ row }">
          {{ row.nickname || '-' }}<br>
          <span style="color:#9CA3AF;font-size:12px">{{ row.phone }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="plan" label="套餐" width="100">
        <template #default="{ row }">{{ planLabel(row.plan) }}</template>
      </el-table-column>
      <el-table-column prop="amount" label="金额" width="100">
        <template #default="{ row }">¥ {{ Number(row.amount).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" effect="dark">
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="pay_method" label="支付方式" width="120">
        <template #default="{ row }">
          {{ payMethodLabel(row.pay_method) }}
        </template>
      </el-table-column>
      <el-table-column prop="paid_at" label="支付时间" width="180">
        <template #default="{ row }">{{ formatTime(row.paid_at) }}</template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      class="pager"
      @current-change="loadData"
      @size-change="loadData"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getOrders } from '@/api/admin'

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const status = ref('')
const loading = ref(false)

const loadData = async () => {
  loading.value = true
  try {
    const data = await getOrders({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value,
      status: status.value
    })
    list.value = data.list
    total.value = data.total
  } finally { loading.value = false }
}
const reload = () => { page.value = 1; loadData() }

const formatTime = (t) => t ? new Date(t).toLocaleString() : '-'

const planLabel = (p) => ({ month: '月度', quarter: '季度', year: '年度' }[p] || p)
const statusLabel = (s) => ({
  pending: '待支付', paid: '已支付', refunded: '已退款', cancelled: '已取消'
}[s] || s)
const statusTagType = (s) => ({
  pending: 'info', paid: 'success', refunded: 'warning', cancelled: 'danger'
}[s] || '')
const payMethodLabel = (m) => ({
  wechat: '💚 微信', alipay: '💙 支付宝', apple_iap: '🍎 Apple'
}[m] || m)

onMounted(loadData)
</script>

<style scoped>
.toolbar {
  display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
}
.total { color: #6B7280; font-size: 14px; margin-left: auto; }
.pager { margin-top: 16px; justify-content: flex-end; }
</style>
