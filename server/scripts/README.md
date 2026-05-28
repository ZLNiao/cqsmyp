# 明星人脸库初始化

## 步骤

### 1. 准备明星图片

```bash
mkdir -p server/scripts/celebs-images
# 把明星正面照（JPG/PNG）放进这个目录
```

> ⚠️ **法律提醒**：使用明星照片做"相似度对比"功能可能涉及肖像权。建议：
> - 仅用于个人技术学习
> - 商业上线前与版权方授权 / 用 AI 生成的虚拟形象替代
> - 或者改成「相似的虚拟头像」绕开版权问题

### 2. 编辑元数据

复制示例：
```bash
cd server/scripts
cp celebs-meta.example.json celebs-meta.json
# 编辑 celebs-meta.json，与你的图片文件名对应
```

字段说明：
| 字段 | 说明 |
|------|------|
| `file` | 图片文件名（相对 celebs-images/） |
| `baiduUserId` | 百度 FaceSet 的 user_id，只能字母/数字/下划线，全局唯一 |
| `name` | 明星中文名 |
| `emoji` | 头像 emoji |
| `faceShape` | 脸型：heart/oval/round/square/triangle |
| `bg` | 头像渐变色（CSS linear-gradient）|

### 3. 跑脚本

```bash
cd server
# 确保 .env 里 BAIDU_AI_API_KEY/SECRET_KEY 已配
node scripts/init-celebs.js
```

输出示例：
```
==> 创建/验证人脸库分组
==> 读取元数据
   找到 7 个明星条目
✅ 刘亦菲（liuyifei）
✅ 迪丽热巴（dilireba）
✅ 杨幂（yangmi）
...
==> 完成：成功 7，失败 0
```

### 4. 后续管理

- 添加新明星：编辑 meta.json 加新条目，重跑脚本（已有的会跳过）
- 通过管理后台增删（任务 #4 完成后）
