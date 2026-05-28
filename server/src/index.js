/**
 * GlamUp 后端入口
 */
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'

import logger from './utils/logger.js'
import errorHandler from './middleware/error.js'
import authRouter from './routes/auth.js'
import analysisRouter from './routes/analysis.js'
import orderRouter from './routes/order.js'
import adminRouter from './routes/admin.js'

const app = express()
const PORT = process.env.PORT || 3000

// 信任 nginx 代理（拿到真实 IP 用于限流）
app.set('trust proxy', 1)

// 安全 + 性能中间件
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
    : '*',
  credentials: true
}))
app.use(compression())

// ⚠️ 微信支付回调必须用 raw body 才能验签
app.use(
  '/api/order/callback/wechat',
  express.raw({ type: 'application/json', limit: '5mb' })
)

// 其他所有路由用 JSON 解析
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 普通用户限流：每 IP 每分钟 60 次
const userLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { code: 429, message: '请求过于频繁，请稍后再试' }
})

// 管理后台限流：单独宽松一些（管理员表格频繁拉取）
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: { code: 429, message: '请求过于频繁' }
})

// 健康检查（无限流）
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

// 业务路由
app.use('/api/admin', adminLimiter, adminRouter)
app.use('/api/user', userLimiter, authRouter)
app.use('/api/analysis', userLimiter, analysisRouter)
app.use('/api/order', userLimiter, orderRouter)

app.use(errorHandler)

app.listen(PORT, () => {
  logger.info(`GlamUp server listening on port ${PORT}`)
})
