<template>
  <div class="page-card">
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索手机号或昵称"
        style="width: 300px"
        clearable
        @keyup.enter="reload"
        @clear="reload"
      >
        <template #append>
          <el-button :icon="Search" @click="reload" />
        </template>
      </el-input>
      <span class="total">共 {{ total }} 条</span>
    </div>

    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="phone" label="手机号" width="140" />
      <el-table-column prop="nickname" label="昵称" />
      <el-table-column label="会员状态" width="160">
        <template #default="{ row }">
          <el-tag v-if="isActiveVip(row)" type="warning" effect="dark">
            👑 VIP {{ formatExpiry(row.vip_expiry) }}
          </el-tag>
          <el-tag v-else type="info">普通用户</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="注册时间" width="180">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openVipDialog(row)">调整 VIP</el-button>
        </template>
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

    <!-- VIP 调整弹窗 -->
    <el-dialog v-model="vipDialog" title="调整 VIP" width="400px">
      <p style="color:#6B7280;font-size:14px;margin:0 0 12px">
        用户：{{ currentUser?.nickname }}（{{ currentUser?.phone }}）
      </p>
      <el-form label-width="80px">
        <el-form-item label="操作">
          <el-radio-group v-model="vipAction">
            <el-radio value="grant">赠送</el-radio>
            <el-radio value="revoke">取消 VIP</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="天数" v-if="vipAction === 'grant'">
          <el-input-number v-model="vipDays" :min="1" :max="365" />
          <span style="margin-left:8px;color:#9CA3AF;font-size:12px">天</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="vipDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitVip">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getUsers, setUserVip } from '@/api/admin'

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const loading = ref(false)

const vipDialog = ref(false)
const currentUser = ref(null)
const vipAction = ref('grant')
const vipDays = ref(30)
const submitting = ref(false)

const loadData = async () => {
  loading.value = true
  try {
    const data = await getUsers({ page: page.value, pageSize: pageSize.value, keyword: keyword.value })
    list.value = data.list
    total.value = data.total
  } finally { loading.value = false }
}

const reload = () => { page.value = 1; loadData() }

const isActiveVip = (row) => row.is_vip && row.vip_expiry && new Date(row.vip_expiry) > new Date()
const formatExpiry = (t) => t ? new Date(t).toLocaleDateString() : ''
const formatTime = (t) => t ? new Date(t).toLocaleString() : ''

const openVipDialog = (row) => {
  currentUser.value = row
  vipAction.value = 'grant'
  vipDays.value = 30
  vipDialog.value = true
}
const submitVip = async () => {
  submitting.value = true
  try {
    const days = vipAction.value === 'grant' ? vipDays.value : 0
    await setUserVip(currentUser.value.id, days)
    ElMessage.success('操作成功')
    vipDialog.value = false
    loadData()
  } finally { submitting.value = false }
}

onMounted(loadData)
</script>

<style scoped>
.toolbar {
  display: flex; align-items: center; gap: 16px; margin-bottom: 16px;
}
.total { color: #6B7280; font-size: 14px; }
.pager { margin-top: 16px; justify-content: flex-end; }
</style>
