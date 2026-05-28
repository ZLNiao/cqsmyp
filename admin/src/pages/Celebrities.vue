<template>
  <div class="page-card">
    <div class="toolbar">
      <h2 class="page-title" style="margin: 0">明星人脸库（共 {{ list.length }} 个）</h2>
      <el-button type="primary" :icon="Plus" @click="openAddDialog">添加明星</el-button>
    </div>

    <el-table :data="list" v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="头像" width="80">
        <template #default="{ row }">
          <div class="avatar" :style="{ background: row.bg }">{{ row.emoji }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column prop="baidu_user_id" label="百度 user_id" width="160" />
      <el-table-column prop="face_shape" label="脸型" width="100" />
      <el-table-column prop="created_at" label="添加时间">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-popconfirm title="确定删除？" @confirm="onDelete(row)">
            <template #reference>
              <el-button type="danger" size="small" :disabled="!auth.isSuper">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加弹窗 -->
    <el-dialog v-model="addDialog" title="添加明星" width="500px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="明星图片" required>
          <el-upload
            :auto-upload="false"
            :limit="1"
            :on-change="onFileChange"
            :on-remove="() => form.file = null"
            list-type="picture"
            accept="image/jpeg,image/png,image/webp"
          >
            <el-button :icon="Upload">选择文件</el-button>
            <template #tip>
              <div style="color:#9CA3AF;font-size:12px">仅支持清晰的明星正面照</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="百度 user_id" required>
          <el-input v-model="form.baiduUserId" placeholder="如 liuyifei，仅字母/数字/下划线" />
        </el-form-item>
        <el-form-item label="姓名" required>
          <el-input v-model="form.name" placeholder="如 刘亦菲" />
        </el-form-item>
        <el-form-item label="Emoji">
          <el-input v-model="form.emoji" maxlength="2" placeholder="如 👩" style="width: 100px" />
        </el-form-item>
        <el-form-item label="脸型">
          <el-select v-model="form.faceShape" placeholder="请选择" clearable>
            <el-option v-for="opt in faceShapes" :key="opt.value" :value="opt.value" :label="opt.label" />
          </el-select>
        </el-form-item>
        <el-form-item label="头像渐变色">
          <el-input v-model="form.bg" placeholder="linear-gradient(135deg, #FBCFE8, #F472B6)" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAdd">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus, Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getCelebrities, addCelebrity, removeCelebrity } from '@/api/admin'
import { useAuthStore } from '@/store/auth'

const auth = useAuthStore()

const list = ref([])
const loading = ref(false)
const addDialog = ref(false)
const submitting = ref(false)

const form = reactive({
  file: null,
  baiduUserId: '',
  name: '',
  emoji: '👩',
  faceShape: '',
  bg: 'linear-gradient(135deg, #FBCFE8, #F472B6)'
})

const faceShapes = [
  { value: 'heart', label: '心形脸' },
  { value: 'oval', label: '鹅蛋脸' },
  { value: 'round', label: '圆脸' },
  { value: 'square', label: '方脸' },
  { value: 'triangle', label: '三角脸' }
]

const loadData = async () => {
  loading.value = true
  try {
    const data = await getCelebrities()
    list.value = data.list
  } finally { loading.value = false }
}

const formatTime = (t) => t ? new Date(t).toLocaleString() : '-'

const openAddDialog = () => {
  form.file = null
  form.baiduUserId = ''
  form.name = ''
  form.emoji = '👩'
  form.faceShape = ''
  form.bg = 'linear-gradient(135deg, #FBCFE8, #F472B6)'
  addDialog.value = true
}

const onFileChange = (file) => { form.file = file.raw }

const submitAdd = async () => {
  if (!form.file) return ElMessage.warning('请上传图片')
  if (!form.baiduUserId || !/^[a-zA-Z0-9_]+$/.test(form.baiduUserId)) {
    return ElMessage.warning('百度 user_id 只能包含字母、数字、下划线')
  }
  if (!form.name) return ElMessage.warning('请输入姓名')

  submitting.value = true
  try {
    const fd = new FormData()
    fd.append('file', form.file)
    fd.append('baiduUserId', form.baiduUserId)
    fd.append('name', form.name)
    fd.append('emoji', form.emoji || '👩')
    fd.append('bg', form.bg)
    if (form.faceShape) fd.append('faceShape', form.faceShape)
    await addCelebrity(fd)
    ElMessage.success('添加成功')
    addDialog.value = false
    loadData()
  } finally { submitting.value = false }
}

const onDelete = async (row) => {
  await removeCelebrity(row.baidu_user_id)
  ElMessage.success('删除成功')
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}
.avatar {
  width: 48px; height: 48px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
}
</style>
