import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import { detectFace } from '../services/baidu-ai.js'
import { describeFaceShape, analyzeFeatures } from '../services/face-features.js'
import { analyzeSkinTone } from '../services/skin-tone.js'
import { determineSeason, describeSkin } from '../utils/color-season.js'
import { generateMakeup } from '../services/llm.js'
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

/**
 * POST /api/analysis/face
 * 完整人脸 + 肤色 + 妆容分析
 *
 * Form-Data:
 *   - file: 图片文件
 *   - userInfo: JSON 字符串 { age, gender, makeupFreq, skinNeeds }
 *
 * Returns: { faceShape, skinTone, season, features, makeup, beauty, age, gender }
 */
router.post('/face', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    const buffer = req.file?.buffer
    if (!buffer) {
      return res.status(400).json({ code: 400, message: '缺少图片文件' })
    }

    let userInfo = {}
    if (req.body.userInfo) {
      try { userInfo = JSON.parse(req.body.userInfo) } catch {}
    }

    logger.info(`[analysis] 用户 ${req.user.uid} 开始分析，图片大小 ${buffer.length} bytes`)

    // ① 百度 AI 人脸检测
    const face = await detectFace(buffer)

    // ② 推算脸型
    const faceShape = describeFaceShape(face.face_shape)

    // ③ 五官特征（landmark150 几何运算）
    const features = analyzeFeatures(face.landmark150)

    // ④ 肤色分析（sharp 提取脸颊像素）
    const skinTone = await analyzeSkinTone(buffer, face.landmark150)

    // ⑤ 色彩季型
    const season = determineSeason(skinTone)
    season.skinDescription = describeSkin(skinTone)

    // ⑥ LLM 生成妆容（失败自动降级到规则）
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
      makeup,
      celebs: getMockCelebs(faceShape.type), // V2 再接真实人脸搜索
      beauty: face.beauty || 0,
      age: face.age || null,
      gender: face.gender?.type || null,
      analysisVersion: 'v1'
    }

    // ⑦ 写历史记录（异步，不阻塞响应）
    saveHistory(req.user.uid, result).catch((e) =>
      logger.error('保存分析记录失败:', e.message)
    )

    res.json({ code: 0, data: result })
  } catch (e) {
    logger.error('分析失败:', e.message)
    next(e)
  }
})

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

/** 临时明星相似度 mock（V2 用百度人脸搜索 V3 真实匹配） */
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
