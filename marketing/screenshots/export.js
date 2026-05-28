/**
 * 截图批量导出脚本（Puppeteer）
 *
 * 用法：
 *   cd cqsmyp/marketing/screenshots
 *   npm install
 *   npm run export
 *
 * 输出：
 *   output/
 *   ├── ios-65/      iOS 6.5"（1290×2796）- iPhone 14/15 Pro Max 必需
 *   ├── ios-55/      iOS 5.5"（1242×2208）- iPhone 8 Plus 兼容（可选）
 *   └── android/     Android（1080×2340）- 国内市场通用
 *
 * 比例对照：
 *   设计稿原尺寸 1290×2796（比例 0.4614）
 *   iOS 6.5"   1290×2796   完美匹配（scale=1）
 *   Android    1080×2340   完美匹配（scale=0.8372，高度刚好）
 *   iOS 5.5"   1242×2208   比例不同（按宽度 scale=0.963 → 裁切底部 485px）
 */
import puppeteer from 'puppeteer'
import path from 'node:path'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SHOTS = [
  { file: 'shot-1-home.html', name: '01-home' },
  { file: 'shot-2-analysis.html', name: '02-analysis' },
  { file: 'shot-3-color.html', name: '03-color' },
  { file: 'shot-4-makeup.html', name: '04-makeup' },
  { file: 'shot-5-celebs.html', name: '05-celebs' },
  { file: 'shot-6-subscribe.html', name: '06-subscribe' }
]

const TARGETS = [
  {
    name: 'ios-65',
    width: 1290,
    height: 2796,
    desc: 'iOS 6.5" - iPhone 14/15 Pro Max（Apple 必需）'
  },
  {
    name: 'android',
    width: 1080,
    height: 2340,
    desc: 'Android 全面屏（国内市场通用，比例完美匹配）'
  },
  {
    name: 'ios-55',
    width: 1242,
    height: 2208,
    desc: 'iOS 5.5" - iPhone 8 Plus 兼容（可选，按宽度缩放）'
  }
]

const SOURCE_WIDTH = 1290
const SOURCE_HEIGHT = 2796

async function main() {
  console.log('🚀 启动 Puppeteer...')
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  for (const target of TARGETS) {
    const outDir = path.join(__dirname, 'output', target.name)
    await fs.mkdir(outDir, { recursive: true })

    // 按宽度等比缩放
    const scale = target.width / SOURCE_WIDTH

    console.log(`\n📐 [${target.name}] ${target.desc}`)
    console.log(`   尺寸 ${target.width}×${target.height} · scale=${scale.toFixed(4)}`)

    for (const shot of SHOTS) {
      const page = await browser.newPage()
      await page.setViewport({
        width: target.width,
        height: target.height,
        deviceScaleFactor: 1
      })

      const url = `file://${path.join(__dirname, shot.file)}`
      await page.goto(url, { waitUntil: 'networkidle0' })

      await page.evaluate((s, w, h) => {
        const canvas = document.querySelector('.canvas')
        if (canvas) {
          canvas.style.transform = `scale(${s})`
          canvas.style.transformOrigin = 'top left'
          canvas.style.position = 'absolute'
          canvas.style.left = '0'
          canvas.style.top = '0'
        }
        document.body.style.width = `${w}px`
        document.body.style.height = `${h}px`
        document.body.style.margin = '0'
        document.body.style.overflow = 'hidden'
        // 默认背景（防止裁切区域露出灰色）
        document.body.style.background = 'linear-gradient(180deg, #FAF5FF 0%, #FDF2F8 50%, #F8F9FA 100%)'
      }, scale, target.width, target.height)

      // 等动画稳定
      await new Promise((r) => setTimeout(r, 400))

      const outFile = path.join(outDir, `${shot.name}.png`)
      await page.screenshot({
        path: outFile,
        clip: { x: 0, y: 0, width: target.width, height: target.height },
        omitBackground: false
      })

      console.log(`   ✅ ${shot.name}.png`)
      await page.close()
    }
  }

  await browser.close()
  console.log('\n🎉 全部导出完成！查看 output/ 目录\n')
  console.log('📤 上传指引：')
  console.log('   - App Store Connect 上传 output/ios-65/ 全部 6 张')
  console.log('   - 国内 Android 市场（华为/小米/OPPO等）上传 output/android/ 全部 6 张')
  console.log('   - iPhone 8 Plus 兼容（可选）上传 output/ios-55/')
}

main().catch((e) => {
  console.error('❌ 导出失败：', e)
  console.error('\n💡 常见问题：')
  console.error('   - Linux: 缺少 Chrome 依赖，运行：sudo apt install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2')
  console.error('   - Mac/Windows: 一般无需额外依赖')
  console.error('   - 还不行可手动用浏览器开发者工具截图（README 有说明）')
  process.exit(1)
})
