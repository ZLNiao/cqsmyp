import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import { detectFace, analyzeSkin } from '../services/baidu-ai.js'
import { generateMakeup } from '../services/llm.js'

const router = Router()
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } })

/** 完整分析：人脸 + 肤色 + 妆容建议 */
router.post('/face', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    const imageBuffer = req.file?.buffer
    if (!imageBuffer) return res.status(400).json({ code: 400, message: '缺少图片' })

    // 1. 百度 AI 人脸检测 → 脸型 + 五官
    const face = await detectFace(imageBuffer)
    // 2. 百度 AI 皮肤分析 → 肤色 + 冷暖调
    const skin = await analyzeSkin(imageBuffer)
    // 3. LLM 生成妆容建议
    const makeup = await generateMakeup({ face, skin, userInfo: req.body.userInfo })

    res.json({
      code: 0,
      data: {
        faceShape: face.shape,
        skinTone: skin.tone,
        features: face.features,
        celebs: face.celebs || [],
        makeup
      }
    })
  } catch (e) { next(e) }
})

/** 历史记录 */
router.get('/history', requireAuth, async (req, res) => {
  // TODO: 查询数据库
  res.json({ code: 0, data: { list: [], total: 0 } })
})

export default router
