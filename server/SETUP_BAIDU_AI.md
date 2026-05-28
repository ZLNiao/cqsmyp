# 百度 AI 接入指南（人脸检测 + 肤色 + 妆容）

## 一、注册百度智能云（10 分钟）

1. 访问 [百度智能云控制台](https://console.bce.baidu.com/)
2. 注册账号 → 实名认证（个人身份证即可）
3. 进入「人脸识别」产品 → 立即领取免费资源

## 二、创建应用

1. [人脸识别控制台](https://console.bce.baidu.com/ai/?fromai=1#/ai/face/app/list) → 创建应用
2. 应用名称：`GlamUp`
3. 接口选择：**全部勾选**（特别是「人脸检测」和「人脸对比」）
4. 创建后复制 **API Key** + **Secret Key**

## 三、免费额度

| 接口 | 免费 QPS | 免费额度 |
|------|---------|---------|
| 人脸检测 V3 | 2 | 1000 次/天 |
| 人脸对比 | 2 | 1000 次/天 |
| 人脸搜索 | 2 | 500 次/天 |

> 💡 **超出后**：人脸检测 ¥0.0035/次，1000 次 ¥3.5。日活 1 万的产品月费约 ¥1000~3000。

## 四、配置到 .env

```bash
BAIDU_AI_API_KEY=你的_API_Key
BAIDU_AI_SECRET_KEY=你的_Secret_Key

# DeepSeek（用于生成妆容方案，不配也行，会降级到规则方案）
DEEPSEEK_API_KEY=你的_DeepSeek_Key
```

## 五、本地测试

```bash
# 1. 安装依赖（注意：sharp 安装需要 vips）
cd server
npm install

# 2. 启动数据库 + Redis
cd ../deploy
docker compose up -d mysql redis

# 3. 启动服务
cd ../server
npm run dev

# 4. 测试分析接口
# 先登录拿 token
TOKEN=$(curl -s -X POST http://localhost:3000/api/user/sms \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000"}' && \
  curl -s -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","code":"123456"}' | jq -r .data.token)

# 上传照片分析
curl -X POST http://localhost:3000/api/analysis/face \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./test-face.jpg" \
  -F 'userInfo={"age":"25-34","makeupFreq":"偶尔"}'
```

## 六、分析流程详解

```
用户上传图片
    ↓
百度 AI 人脸检测 V3
    │
    ├─→ face_shape (5 种脸型 + 概率)
    │     └─→ describeFaceShape() 中文描述 + 修饰建议
    │
    ├─→ landmark150 (150 个关键点)
    │     └─→ analyzeFeatures() 几何运算推算：
    │            眼型 / 眉形 / 唇形 / 鼻型
    │
    └─→ beauty (颜值评分 0-100)
          └─→ 直接展示

图片 Buffer
    ↓
sharp 提取脸颊像素
    ↓
RGB 均值 → HSV 转换
    ↓
classify(undertone, depth)
    ↓
determineSeason() → 4 大季型
    ↓
推荐色板（每个季型 6 种色）

faceShape + season + features + userInfo
    ↓
DeepSeek LLM (失败 → 规则兜底)
    ↓
妆容方案 { title, steps[底妆/眼妆/唇妆/腮红] }
```

## 七、算法准确度说明

| 维度 | 实现方式 | 准确度 |
|------|---------|--------|
| 脸型 | 百度 AI 模型 | ⭐⭐⭐⭐⭐ |
| 颜值评分 | 百度 AI 模型 | ⭐⭐⭐⭐ |
| 五官分类 | 关键点几何运算（自研规则）| ⭐⭐⭐ |
| 肤色冷暖调 | 脸颊 RGB 均值 + HSV | ⭐⭐⭐ |
| 色彩季型 | 4 大季型经典理论 | ⭐⭐⭐⭐ |
| 妆容推荐 | LLM 生成 + 个性化 prompt | ⭐⭐⭐⭐ |

**提升方案（V2）**：
- 五官：训练自己的 CV 模型，或用 MediaPipe 关键点 + 更多规则
- 肤色：用 ColorThief 提取主色，对比 Pantone 色库
- 季型：12 季型细分（春/夏/秋/冬 各 3 子季）
- 明星相似度：用百度人脸搜索 V3，建立明星库

## 八、生产环境优化

```js
// 1. 加图片压缩（减少百度 API 流量）
const compressed = await sharp(buffer)
  .resize(800, 800, { fit: 'inside' })
  .jpeg({ quality: 85 })
  .toBuffer()

// 2. 加缓存（同一张图 5 分钟内返回缓存结果）
const hash = crypto.createHash('md5').update(buffer).digest('hex')
const cached = await redis.get(`analysis:${hash}`)
if (cached) return JSON.parse(cached)
// ... 分析后
await redis.setex(`analysis:${hash}`, 300, JSON.stringify(result))

// 3. 加请求队列（防止瞬时并发超过百度 QPS 限制）
// 用 bullmq 或 p-queue 排队
```

## 九、常见错误

### 222202: pic not has face
- 原因：图片中没识别到人脸
- 解决：让用户上传清晰正面照（已在前端 loading 页显示错误提示）

### 17: Open api daily request limit reached
- 原因：免费额度用完
- 解决：去百度智能云充值，或限制每日分析次数

### 100001: Invalid Parameter
- 原因：图片格式不对 / 太大
- 解决：上传前压缩到 4MB 以内

### sharp 安装失败
- Mac：`brew install vips && npm install sharp`
- Linux：`apt-get install libvips-dev`
- Docker 镜像已配好（见 Dockerfile 的 `apk add vips-dev vips`）
