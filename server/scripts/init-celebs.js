/**
 * 明星人脸库批量初始化脚本
 *
 * 用法：
 *   1. 准备明星图片到 ./celebs-images/ 目录
 *   2. 准备 ./celebs-meta.json：
 *      [
 *        { "file": "liuyifei.jpg", "baiduUserId": "liuyifei", "name": "刘亦菲",
 *          "emoji": "👩", "faceShape": "heart",
 *          "bg": "linear-gradient(135deg, #FBCFE8, #F472B6)" }
 *      ]
 *   3. 执行：node scripts/init-celebs.js
 *
 * 命名规则：
 *   - baiduUserId 只能用字母、数字、下划线（百度限制）
 *   - 每张图必须是清晰的明星正面照
 */
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { addCelebrity } from '../src/services/celebs.js'
import { createFaceGroup } from '../src/services/baidu-ai.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const IMAGES_DIR = path.join(__dirname, 'celebs-images')
const META_FILE = path.join(__dirname, 'celebs-meta.json')

async function main() {
  console.log('==> 创建/验证人脸库分组')
  await createFaceGroup()

  console.log('==> 读取元数据')
  const meta = JSON.parse(await fs.readFile(META_FILE, 'utf8'))
  console.log(`   找到 ${meta.length} 个明星条目`)

  let success = 0
  let failed = 0

  for (const item of meta) {
    const filePath = path.join(IMAGES_DIR, item.file)
    try {
      const imageBuffer = await fs.readFile(filePath)
      await addCelebrity({
        baiduUserId: item.baiduUserId,
        name: item.name,
        emoji: item.emoji,
        bg: item.bg,
        faceShape: item.faceShape,
        imageBuffer,
        imageUrl: item.imageUrl
      })
      console.log(`✅ ${item.name}（${item.baiduUserId}）`)
      success += 1
    } catch (e) {
      console.log(`❌ ${item.name}: ${e.message}`)
      failed += 1
    }
  }

  console.log(`\n==> 完成：成功 ${success}，失败 ${failed}`)
  process.exit(0)
}

main().catch((e) => {
  console.error('初始化失败：', e)
  process.exit(1)
})
