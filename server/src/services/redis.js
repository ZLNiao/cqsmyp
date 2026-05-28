import Redis from 'ioredis'
import logger from '../utils/logger.js'

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: false,
  maxRetriesPerRequest: 3
})

redis.on('error', (e) => logger.error('Redis error: ' + e.message))
redis.on('connect', () => logger.info('Redis connected'))

export default redis
