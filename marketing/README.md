# GlamUp 营销 / 上架素材包

```
marketing/
├── README.md               (本文件)
├── store-listing.md        iOS App Store + Android 各市场上架文案
├── icon-prompts.md         应用图标 AI 生成 prompt（Midjourney/即梦/通义万相）
└── screenshots/            6 张上架截图设计稿
    ├── index.html          总览页（缩略图）
    ├── _shared.css         共享样式
    ├── shot-1-home.html    截图 #1 首页
    ├── shot-2-analysis.html 截图 #2 脸型分析
    ├── shot-3-color.html   截图 #3 色彩季型
    ├── shot-4-makeup.html  截图 #4 AI 换妆
    ├── shot-5-celebs.html  截图 #5 明星相似度
    ├── shot-6-subscribe.html 截图 #6 订阅页
    ├── package.json
    └── export.js           Puppeteer 一键导出脚本
```

---

## 🎨 6 张截图速览

| # | 主题 | 一句话卖点 |
|---|------|----------|
| 1 | 首页 | **3 秒读懂你的美** · AI 美颜分析 · 找到属于你的色彩 |
| 2 | 脸型分析 | **精准识别你的脸型** · 5 大脸型 + 4 大五官特征 |
| 3 | 色彩季型 | **找到你的本命色** · 12 季型色彩理论 · AI 私人色彩师 |
| 4 | AI 换妆 | **Before / After 一键变美** · 4 种妆容风格 |
| 5 | 明星相似度 | **发现你的明星脸** · 百万明星人脸库 |
| 6 | 订阅页 | **7 天免费试用** · 解锁完整功能 |

---

## 📐 输出尺寸

| 平台 | 尺寸 | 用途 | 与设计稿匹配度 |
|------|------|------|----------------|
| **iOS 6.5"** | 1290×2796 | iPhone 14/15 Pro Max（Apple 必需） | ⭐⭐⭐⭐⭐ 完美 |
| **Android** | 1080×2340 | 全面屏（国内各大市场通用） | ⭐⭐⭐⭐⭐ 完美匹配（scale=0.8372） |
| **iOS 5.5"** | 1242×2208 | iPhone 8 Plus（可选，按宽度缩放） | ⭐⭐⭐ 比例不同会裁底 |

> 💡 设计稿是 **1290×2796**（即 iOS 6.5" 比例），Android 1080×2340 比例几乎一样，所以缩放后完美贴合。

---

## 🚀 使用流程（3 选 1）

### 方式 A：Puppeteer 一键批量导出（推荐 ⭐）

```bash
cd marketing/screenshots
npm install                    # 装 puppeteer（首次约 2 分钟）
npm run export                 # 一键导出 18 张 PNG
```

输出：

```
output/
├── ios-65/         1290×2796 × 6 张
├── android/        1080×2340 × 6 张
└── ios-55/         1242×2208 × 6 张
```

> ⚠️ Linux 服务器缺 Chrome 依赖时报错 `libnss3.so`，运行：
> ```bash
> sudo apt install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
>   libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
>   libgbm1 libpango-1.0-0 libcairo2 libasound2
> ```
> Mac / Windows 一般无需额外依赖。

### 方式 B：浏览器开发者工具手动截图

1. 用任意静态服务起本地：
   ```bash
   cd marketing/screenshots
   npx serve .
   # 或 python3 -m http.server 8000
   ```
2. Chrome 打开 `http://localhost:3000/shot-1-home.html`
3. F12 → 设备工具栏（Toggle device toolbar，Ctrl+Shift+M）
4. 顶部尺寸下拉框输入 `1290 × 2796`
5. 设备菜单（⋮）→ **Capture full size screenshot**
6. 重复 6 张 × 3 种尺寸 = 18 次

### 方式 C：用在线截图工具

把 6 个 HTML 文件部署到任意可访问 URL（Netlify/Vercel 一键），然后用：
- [browserstack.com/screenshots](https://www.browserstack.com/screenshots)
- [screenshot.guru](https://screenshot.guru/)

---

## 📤 上传到应用商店

### iOS App Store Connect

1. App Store Connect → 你的 App → 当前版本
2. **截屏** 区域 → 6.5" Display（必需） → 上传 `output/ios-65/` 全部 6 张
3. （可选）5.5" Display → 上传 `output/ios-55/`
4. （兼容 iPad 时必需）iPad Pro 12.9" → 单独制作（设计稿改 width:2048; height:2732）

> ⚠️ Apple 顺序很重要：截图 1 是用户第一眼看到的，建议放最有冲击力的（推荐 #4 AI 换妆）

### Android 各市场

| 市场 | 上传位置 |
|------|---------|
| 华为应用市场 | 应用市场连接 → 应用图片资料 → 应用截图 |
| 小米应用商店 | 我的应用 → 编辑 → 应用截图 |
| OPPO 软件商店 | 应用管理 → 应用资料 → 截图 |
| vivo 应用商店 | 应用包 → 应用图片 → 截图 |
| 腾讯应用宝 | 我的 App → App 资源 → 应用截图 |

每个市场至少传 3 张，建议传齐 6 张 `output/android/`。

---

## 🎨 改文案 / 改配色

### 改标题

每张截图的标题 + 副标题在对应 HTML 的 `<div class="headline">` 里：

```html
<div class="headline">
  <h1>3 秒读懂<br><span class="gradient">你的美</span></h1>
  <p>AI 美颜分析 · 找到属于你的色彩</p>
</div>
```

直接改文字内容即可，无需改样式。

### 改主色

主题渐变色定义在 `_shared.css`：

```css
.headline h1 .gradient {
  background: linear-gradient(135deg, #8B5CF6, #EC4899);  /* 改这里 */
}
```

---

## 🖼️ 用真实手机截图替换 mockup

目前的截图是 **HTML/CSS 模拟的 App UI**。要换成真机截图：

1. 用 HBuilderX 真机运行 App
2. 在每个核心页面手动截图（建议 1170×2532 或更高分辨率）
3. 把截图放到 `marketing/screenshots/raw/` 目录
4. 修改对应 shot HTML，把 `<div class="phone-screen">...</div>` 中间的内容替换为：
   ```html
   <div class="phone-screen">
     <div class="notch"></div>
     <img src="raw/home.png" style="width: 100%; height: 100%; object-fit: cover;" />
   </div>
   ```

这样保留了我们设计的「手机外壳 + 顶部标题 + 底部品牌区」，但中间是真实截图，效果最好。

---

## 📋 上架前最终检查清单

- [ ] 6 张截图全部导出完成
- [ ] 改了 brand-tag 的占位文字（如有）
- [ ] 应用图标设计完成（参考 `icon-prompts.md`）
- [ ] App 描述完成（参考 `store-listing.md`）
- [ ] 关键词已优化（避免重复，包含核心搜索词）
- [ ] 演示账号已设置（iOS 审核员需要）
- [ ] 隐私政策 URL 可访问
- [ ] 内购产品已审核通过（iOS）
- [ ] 完整流程参考 `../RELEASE_CHECKLIST.md`
