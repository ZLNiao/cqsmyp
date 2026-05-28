# GlamUp 应用图标设计 Prompt 集

可直接复制到 Midjourney / DALL-E / 即梦 / Stable Diffusion 等 AI 生图工具。

---

## 设计原则

- **风格统一**：与 App 内紫粉渐变主题（`#8B5CF6 → #EC4899`）一致
- **极简识别**：图标尺寸最小到 60×60 像素也能看清
- **避免复杂**：不要包含太多细节（人脸细节、文字会糊）
- **品牌联想**：能让人想到「美颜 / 妆容 / 高级感 / 女性向」
- **平台规范**：iOS 不要预设圆角（系统会自动加），Android 用自适应图标

---

## 推荐方案 A：抽象渐变星花（最稳妥 ⭐）

### Midjourney Prompt

```
Mobile app icon design, minimalist abstract sparkle star,
gradient from violet to pink (#8B5CF6 to #EC4899),
soft glowing aura, glass-morphism effect,
centered composition, clean modern aesthetic,
flat 3D rendering, premium beauty app branding,
no text, no faces, isolated on light gradient background,
high resolution 1024x1024 --ar 1:1 --style raw --v 6.0
```

### 即梦（字节）Prompt

```
应用图标设计，主体是一颗简洁优雅的抽象星花/钻石，
紫粉渐变（#8B5CF6 到 #EC4899），柔和光晕，
玻璃质感，正中心构图，扁平 3D 风格，
高级感美颜 App 品牌图标，
不要文字，不要人脸，干净背景，
方形 1:1，1024x1024 像素
```

### 通义万相 Prompt

```
极简风格的应用图标，紫粉渐变（紫色8B5CF6 到 粉色EC4899）的钻石星形，
带柔和光晕和玻璃透明感，圆角方形构图，
高端美颜化妆 App 的 logo，
中心对称，正方形比例，1024x1024
```

---

## 推荐方案 B：化妆元素（口红/眼影盘 抽象化）

### Prompt

```
Modern minimalist app icon, abstract lipstick or makeup palette,
gradient violet pink colors, smooth glassmorphism,
soft shadows, premium feminine beauty app,
flat 3D illustration style, square format,
no text, isolated, clean background,
1024x1024 high quality --v 6.0
```

---

## 推荐方案 C：字母 G + 镜子（品牌强化）

### Prompt

```
App icon design, stylized letter "G" combined with a hand mirror,
gradient violet to pink, glass-morphism, clean modern,
beauty app brand identity, centered, no decorative noise,
flat design with subtle 3D shading,
square 1024x1024, no text
```

---

## 推荐方案 D：心形 + 闪光（最女性向）

### Prompt

```
Cute minimalist app icon, abstract heart shape with sparkles around it,
gradient from purple to pink, soft glow,
modern flat illustration, beauty and self-care theme,
isolated centered composition, clean background,
1024x1024 sharp details, no text
```

---

## 选定后的处理流程

```
1. 用上述 prompt 生成 4~8 张候选
2. 选 1 张最满意的导入 Figma / Photoshop
3. 调整：
   - 留出 ~10% 安全边距（边缘不放重要元素）
   - 整体颜色饱和度提一点（小尺寸下显眼）
   - 去掉过细的线条（小尺寸会糊）
4. 导出多个尺寸
```

### iOS 必需尺寸

```
1024x1024  App Store 主图标
180x180    iPhone @3x
120x120    iPhone @2x
152x152    iPad @2x
```

> ⚠️ iOS 不要自己加圆角！系统会自动处理。如果你加了圆角又被系统再裁一次，会变得很丑。

### Android 必需尺寸

```
512x512    Google Play 主图标（其实国内市场也用这个）
192x192    xxxhdpi
144x144    xxhdpi
96x96      xhdpi
72x72      hdpi
```

**自适应图标（重要）**：
- 前景层（512×512，留 33% 安全区）：核心图形
- 背景层（512×512）：纯色或简单渐变

---

## 一键生成的命令

如果你用 ImageMagick 或者其他工具，可以：

```bash
# 把 1024×1024 的源图批量缩放
for size in 60 76 120 152 167 180 1024; do
  convert source.png -resize ${size}x${size} icon-${size}.png
done

# Android adaptive
convert source.png -resize 512x512 icon-foreground.png
# 背景另存
```

---

## 在线一键生成应用图标的工具

懒人方案（不用自己处理尺寸）：

| 工具 | 说明 | 价格 |
|------|------|------|
| [App Icon Generator](https://appicon.co/) | 上传 1024×1024，自动出全套 iOS+Android | 免费 |
| [Bakery](https://www.bakeryicons.app/) | 直接用模板生成图标，支持 iOS+Android | 免费 |
| [makeappicon.com](https://makeappicon.com/) | 上传一张图，下载所有尺寸 | 免费 |

---

## 图标设计避坑

❌ 不要做的：
- 复杂场景（小图标会看不清）
- 文字（小尺寸糊掉）
- 透明背景（iOS 会变黑）
- 与系统 App 太像（被苹果拒）
- 用网图（侵权风险）

✅ 推荐：
- 单一抽象图形 + 渐变
- 高对比度（深色背景显白）
- 用 AI 生成 → 人工微调 → 多机型预览
