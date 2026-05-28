import logger from '../utils/logger.js'

export default function errorHandler(err, req, res, _next) {
  logger.error(err.stack || err.message)
  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    code: err.code || statusCode,
    message: err.message || '服务器内部错误'
  })
}
