<template>
  <div class="page-card">
    <h2 class="page-title">分析记录</h2>
    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="用户" width="220">
        <template #default="{ row }">
          {{ row.nickname || '-' }}<br>
          <span style="color:#9CA3AF;font-size:12px">{{ row.phone }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="face_shape" label="脸型" width="120" />
      <el-table-column prop="skin_tone" label="色彩季型" width="180" />
      <el-table-column prop="created_at" label="分析时间">
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
import { getAnalyses } from '@/api/admin'

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const loadData = async () => {
  loading.value = true
  try {
    const data = await getAnalyses({ page: page.value, pageSize: pageSize.value })
    list.value = data.list
    total.value = data.total
  } finally { loading.value = false }
}

const formatTime = (t) => t ? new Date(t).toLocaleString() : '-'

onMounted(loadData)
</script>

<style scoped>
.pager { margin-top: 16px; justify-content: flex-end; }
</style>
