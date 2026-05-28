import { Router } from 'express'
import jwt from 'jsonwebtoken'
import redis from '../services/redis.js'
import { sendSms } from '../services/sms.js'
import {
  findOrCreateUser,
  getUserById,
  formatUser
} from '../services/user.js'
import { requireAuth } from '../middleware/auth.js'
import logger from '../utils/logger.js'

const router = Router()

const PHONE_REGEX = /^1[3-9]\d{9}$/

/** POST /api/user/sms - 发送短信验证码 */
router.post('/sms', async (req, res, next) => {
  try {
    const { phone } = req.body
    if (!PHONE_REGEX.test(phone)) {
      return res.status(400).json({ code: 400, message: '手机号格式错误' })
    }

    // 限频 1：同一手机号 60 秒内只能发 1 次
    const lockKey = `sms:lock:${phone}`
    if (await redis.get(lockKey)) {
      return res.status(429).json({ code: 429, message: '发送过于频繁，请 60 秒后再试' })
    }

    // 限频 2：同一 IP 每天最多 10 次
    const today = new Date().toISOString().slice(0, 10)
    const ipKey = `sms:ip:${req.ip}:${today}`
    const ipCount = await redis.incr(ipKey)
    if (ipCount === 1) await redis.expire(ipKey, 86400)
    if (ipCount > 10) {
      return res.status(429).json({ code: 429, message: '今日发送次数已达上限' })
    }

    // 生成 + 发送 + 缓存
    const code = String(Math.floor(100000 + Math.random() * 900000))
    await sendSms(phone, code)
    await redis.setex(`sms:code:${phone}`, 300, code) // 5 分钟有效
    await redis.setex(lockKey, 60, '1')

    logger.info(`SMS sent to ${phone}`)
    res.json({ code: 0, data: { sent: true } })
  } catch (e) {
    next(e)
  }
})

/** POST /api/user/login - 手机号登录 */
router.post('/login', async (req, res, next) => {
  try {
    const { phone, code } = req.body
    if (!PHONE_REGEX.test(phone)) {
      return res.status(400).json({ code: 400, message: '手机号格式错误' })
    }
    if (!/^\d{6}$/.test(code || '')) {
      return res.status(400).json({ code: 400, message: '验证码格式错误' })
    }

    const realCode = await redis.get(`sms:code:${phone}`)
    if (!realCode) {
      return res.status(400).json({ code: 400, message: '验证码已过期，请重新获取' })
    }
    if (realCode !== code) {
      return res.status(400).json({ code: 400, message: '验证码错误' })
    }
    await redis.del(`sms:code:${phone}`) // 用一次即清

    const user = await findOrCreateUser(phone)
    const token = jwt.sign(
      { uid: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    )

    res.json({ code: 0, data: { token, user: formatUser(user) } })
  } catch (e) {
    next(e)
  }
})

/** GET /api/user/profile - 当前用户信息 */
router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const user = await getUserById(req.user.uid)
    if (!user) return res.status(404).json({ code: 404, message: '用户不存在' })
    res.json({ code: 0, data: formatUser(user) })
  } catch (e) {
    next(e)
  }
})

/** POST /api/user/logout - 登出（客户端清 token 即可，此接口预留） */
router.post('/logout', requireAuth, (_, res) => {
  res.json({ code: 0, data: {} })
})

export default router
