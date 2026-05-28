import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import { detectFace } from '../services/baidu-ai.js'
import { describeFaceShape, analyzeFeatures } from '../services/face-features.js'
import { analyzeSkinTone } from '../services/skin-tone.js'
import { determineSeason, describeSkin } from '../utils/color-season.js'
import { generateMakeup } from '../services/llm.js'
import { compressImage, hashBuffer } from '../services/image.js'
import { searchCelebs } from '../services/celebs.js'
import redis from '../services/redis.js'
import { query } from '../services/db.js'
import logger from '../utils/logger.js'

const router = Router()
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_, file, cb) => {
    if (!/^image\/(jpeg|jpg|png|webp)$/.test(file.mimetype)) {
      return cb(new Error('仅支持 JPG/PNG/WebP 格式'))
    }
    cb(null, true)
  }
})

const CACHE_TTL = 5 * 60 // 5 分钟

/**
 * POST /api/analysis/face
 * 完整人脸 + 肤色 + 妆容分析
 *
 * Form-Data:
 *   - file: 图片文件
 *   - userInfo: JSON 字符串 { age, gender, makeupFreq, skinNeeds }
 *
 * Returns: { faceShape, skinTone, features, celebs, makeup, beauty, age, gender, cached }
 */
router.post('/face', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    const rawBuffer = req.file?.buffer
    if (!rawBuffer) {
      return res.status(400).json({ code: 400, message: '缺少图片文件' })
    }

    let userInfo = {}
    if (req.body.userInfo) {
      try { userInfo = JSON.parse(req.body.userInfo) } catch {}
    }

    const t0 = Date.now()
    logger.info(`[analysis] 用户 ${req.user.uid} 开始分析，原图 ${(rawBuffer.length / 1024).toFixed(1)}KB`)

    // ① 压缩图片
    const buffer = await compressImage(rawBuffer)

    // ② 检查 Redis 缓存（用压缩后图的 hash + userInfo 关键字段做 key）
    const imageHash = hashBuffer(buffer)
    const cacheKey = buildCacheKey(imageHash, userInfo)
    const cached = await redis.get(cacheKey)
    if (cached) {
      logger.info(`[analysis] 命中缓存 ${imageHash.slice(0, 8)}，耗时 ${Date.now() - t0}ms`)
      const result = JSON.parse(cached)
      // 仍然写入历史（用户的本次行为要记录）
      saveHistory(req.user.uid, result).catch((e) =>
        logger.error('保存分析记录失败:', e.message)
      )
      return res.json({ code: 0, data: { ...result, cached: true } })
    }

    // ③ 百度 AI 人脸检测
    const face = await detectFace(buffer)

    // ④ 推算脸型
    const faceShape = describeFaceShape(face.face_shape)

    // ⑤ 五官特征（landmark150 几何运算）
    const features = analyzeFeatures(face.landmark150)

    // ⑥ 肤色分析（sharp 提取脸颊像素）
    const skinTone = await analyzeSkinTone(buffer, face.landmark150)

    // ⑦ 色彩季型
    const season = determineSeason(skinTone)
    season.skinDescription = describeSkin(skinTone)

    // ⑧ 明星相似度（百度人脸搜索 V3，失败时回退到 mock）
    const celebs = await searchCelebs(buffer, faceShape.type).catch((e) => {
      logger.warn('明星搜索失败，使用 mock：' + e.message)
      return getMockCelebs(faceShape.type)
    })

    // ⑨ LLM 生成妆容（失败自动降级到规则）
    const makeup = await generateMakeup({ faceShape, season, features, userInfo })

    const result = {
      faceShape,
      skinTone: {
        ...season,
        rgb: skinTone.rgb,
        undertone: skinTone.undertone,
        depth: skinTone.depth
      },
      features,
      celebs,
      makeup,
      beauty: face.beauty || 0,
      age: face.age || null,
      gender: face.gender?.type || null,
      analysisVersion: 'v1'
    }

    // ⑩ 写缓存（异步）
    redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result)).catch((e) =>
      logger.error('写缓存失败:', e.message)
    )

    // ⑪ 写历史记录（异步，不阻塞响应）
    saveHistory(req.user.uid, result).catch((e) =>
      logger.error('保存分析记录失败:', e.message)
    )

    logger.info(`[analysis] 完成，总耗时 ${Date.now() - t0}ms`)

    res.json({ code: 0, data: result })
  } catch (e) {
    logger.error('分析失败:', e.message)
    next(e)
  }
})

/**
 * 缓存 key 设计：
 * 同一张图 + 相同的关键 userInfo（年龄段+化妆频率）→ 命中缓存
 * 因为这两个会影响 LLM 妆容方案
 */
function buildCacheKey(imageHash, userInfo) {
  const age = userInfo?.age || ''
  const freq = userInfo?.makeupFreq || ''
  return `analysis:${imageHash}:${age}:${freq}`
}

/** GET /api/analysis/history - 历史记录 */
router.get('/history', requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const pageSize = 20
    const offset = (page - 1) * pageSize

    const list = await query(
      `SELECT id, face_shape, skin_tone, result_json, created_at
       FROM analyses
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.uid, pageSize, offset]
    )

    const items = list.map((row) => ({
      id: row.id,
      faceShape: row.face_shape,
      skinTone: row.skin_tone,
      result: typeof row.result_json === 'string' ? JSON.parse(row.result_json) : row.result_json,
      createdAt: row.created_at
    }))

    res.json({ code: 0, data: { list: items, page, pageSize } })
  } catch (e) {
    next(e)
  }
})

/** GET /api/analysis/:id - 单条详情 */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const rows = await query(
      'SELECT * FROM analyses WHERE id = ? AND user_id = ? LIMIT 1',
      [req.params.id, req.user.uid]
    )
    if (rows.length === 0) return res.status(404).json({ code: 404, message: '记录不存在' })
    const row = rows[0]
    const result = typeof row.result_json === 'string' ? JSON.parse(row.result_json) : row.result_json
    res.json({ code: 0, data: result })
  } catch (e) {
    next(e)
  }
})

async function saveHistory(userId, result) {
  await query(
    `INSERT INTO analyses (user_id, face_shape, skin_tone, result_json)
     VALUES (?, ?, ?, ?)`,
    [
      userId,
      result.faceShape.label,
      result.skinTone.label,
      JSON.stringify(result)
    ]
  )
}

/** mock 明星数据（百度人脸搜索失败时兜底） */
function getMockCelebs(faceType) {
  const banks = {
    heart: [
      { emoji: '👩', name: '刘亦菲', sim: 85, bg: 'linear-gradient(135deg, #FBCFE8, #F472B6)' },
      { emoji: '👩‍🦰', name: '迪丽热巴', sim: 72, bg: 'linear-gradient(135deg, #FDE68A, #F59E0B)' },
      { emoji: '👩‍🦱', name: '杨幂', sim: 65, bg: 'linear-gradient(135deg, #C4B5FD, #8B5CF6)' }
    ],
    oval: [
      { emoji: '👩', name: '高圆圆', sim: 82, bg: 'linear-gradient(135deg, #DDD6FE, #8B5CF6)' },
      { emoji: '👩‍🦰', name: '汤唯', sim: 75, bg: 'linear-gradient(135deg, #FBCFE8, #F472B6)' },
      { emoji: '👩‍🦱', name: '佟丽娅', sim: 68, bg: 'linear-gradient(135deg, #FDE68A, #F59E0B)' }
    ],
    round: [
      { emoji: '👩', name: '赵丽颖', sim: 80, bg: 'linear-gradient(135deg, #FED7AA, #FB923C)' },
      { emoji: '👩‍🦰', name: '关晓彤', sim: 70, bg: 'linear-gradient(135deg, #FBCFE8, #F472B6)' },
      { emoji: '👩‍🦱', name: '林允', sim: 64, bg: 'linear-gradient(135deg, #C4B5FD, #8B5CF6)' }
    ],
    square: [
      { emoji: '👩', name: '舒淇', sim: 78, bg: 'linear-gradient(135deg, #C4B5FD, #8B5CF6)' },
      { emoji: '👩‍🦰', name: '俞飞鸿', sim: 71, bg: 'linear-gradient(135deg, #DDD6FE, #8B5CF6)' },
      { emoji: '👩‍🦱', name: '袁泉', sim: 66, bg: 'linear-gradient(135deg, #FDE68A, #F59E0B)' }
    ],
    triangle: [
      { emoji: '👩', name: '章子怡', sim: 80, bg: 'linear-gradient(135deg, #FBCFE8, #F472B6)' },
      { emoji: '👩‍🦰', name: '张钧甯', sim: 73, bg: 'linear-gradient(135deg, #FDE68A, #F59E0B)' },
      { emoji: '👩‍🦱', name: '周冬雨', sim: 67, bg: 'linear-gradient(135deg, #C4B5FD, #8B5CF6)' }
    ]
  }
  return banks[faceType] || banks.oval
}

export default router
