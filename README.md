# GlamUp ✨

AI 美颜分析与妆容推荐 App，基于 uni-app + Vue 3。

## 功能清单

| # | 功能 | 实现 |
|---|------|------|
| 1 | 自拍上传 | uni-app `chooseImage` |
| 2 | 人脸检测 | 百度 AI 人脸检测 API |
| 3 | 脸型分析 | 百度 AI |
| 4 | 肤色/冷暖调分析 | 百度 AI 皮肤分析 |
| 5 | 五官特征分析 | 百度 AI |
| 6 | 色彩季型分析 | 自研算法 + LLM |
| 7 | 明星相似度 | 百度 AI 人脸对比 |
| 8 | 妆容推荐 | LLM（DeepSeek / 通义千问）|
| 9 | AI 换妆 | 第三方 AIGC API |
| 10 | Makeup Match | 后端图像处理 |
| 11 | 用户/支付/订阅 | 微信支付 + 支付宝 |
| 12 | 分享/裂变 | uni-app 原生分享 |

## 项目结构

```
src/
├── pages/          # 页面
│   ├── onboard/    # 引导页
│   ├── index/      # 首页
│   ├── info/       # 信息补充
│   ├── result/     # 分析结果
│   ├── subscribe/  # 订阅付费
│   └── profile/    # 个人中心
├── components/     # 组件
├── api/            # API 封装
├── store/          # Pinia 状态
├── static/         # 静态资源
├── App.vue
├── main.js
├── manifest.json   # uni-app 应用配置
├── pages.json      # 路由配置
└── uni.scss        # 全局变量
```

## 开发

### 方式一：HBuilderX（最简单，推荐）

1. 下载 [HBuilderX](https://www.dcloud.io/hbuilderx.html)（选 App 开发版）
2. 菜单 `文件 → 导入 → 从本地目录导入` → 选择本项目
3. 工具栏 → 运行 → 运行到手机或模拟器 → 运行到 Android App 基座

### 方式二：CLI（适合 CI/CD）

```bash
# 安装依赖
npm install

# H5 调试
npm run dev:h5

# App 调试（需要配合 HBuilderX 真机/模拟器基座）
npm run dev:app

# 微信小程序
npm run dev:mp-weixin
```

## 打 APK 包

### 方式一：HBuilderX 云打包（最简单，免本地配置）

1. HBuilderX → 菜单 `发行 → 原生App-云打包`
2. 选 Android → 使用 DCloud 公用证书（免费，但有时长限制）
3. 等待 5~10 分钟下载 APK

### 方式二：HBuilderX 本地打包（需要 Android 环境）

1. 安装 Android Studio + JDK 17
2. HBuilderX → 发行 → 原生App-本地打包 → 生成本地打包 App 资源
3. 用 Android Studio 打开 [离线打包模板](https://nativesupport.dcloud.net.cn/AppDocs/usesdk/android.html)
4. 替换资源目录 → Build → Generate Signed APK

### 方式三：GitHub Actions 云端打包（需先在 HBuilderX 关联 DCloud 账号）

见 `.github/workflows/build-apk.yml`（推送到 main 分支后自动构建）。

## 后端环境变量

后端服务需要以下密钥（**绝不能放前端**）：

```env
BAIDU_AI_API_KEY=xxx
BAIDU_AI_SECRET_KEY=xxx
DEEPSEEK_API_KEY=xxx
WECHAT_PAY_MCH_ID=xxx
WECHAT_PAY_API_KEY=xxx
ALIPAY_APP_ID=xxx
ALIPAY_PRIVATE_KEY=xxx
ALIYUN_OSS_ACCESS_KEY=xxx
ALIYUN_OSS_SECRET=xxx
ALIYUN_SMS_ACCESS_KEY=xxx
```

## 设计规范

- 主色：紫色渐变 `#8B5CF6 → #6D28D9`
- 背景：`#F8F9FA`
- 卡片圆角：`16~24rpx`
- 字体：圆润无衬线
