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

const app = express()
const PORT = process.env.PORT || 3000

// 安全 + 性能中间件
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 限流：每个 IP 每分钟最多 60 次
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { code: 429, message: '请求过于频繁，请稍后再试' }
}))

// 健康检查（部署用）
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

// 业务路由
app.use('/api/user', authRouter)
app.use('/api/analysis', analysisRouter)
app.use('/api/order', orderRouter)

// 全局错误处理
app.use(errorHandler)

app.listen(PORT, () => {
  logger.info(`GlamUp server listening on port ${PORT}`)
})
