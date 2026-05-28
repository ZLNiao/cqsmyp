import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

/** 发送短信验证码 */
router.post('/sms', async (req, res) => {
  const { phone } = req.body
  // TODO: 调用阿里云/腾讯云短信服务
  // await sendSms(phone, code)
  res.json({ code: 0, data: { sent: true } })
})

/** 手机号登录 */
router.post('/login', async (req, res) => {
  const { phone, code } = req.body
  // TODO: 校验验证码 + 查询/创建用户
  // const user = await findOrCreateUser(phone)
  const user = { id: 1, phone, nickname: '美人' }
  const token = jwt.sign({ uid: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' })
  res.json({ code: 0, data: { token, user } })
})

/** 当前用户信息 */
router.get('/profile', requireAuth, (req, res) => {
  res.json({ code: 0, data: { uid: req.user.uid, isVip: false } })
})

export default router
