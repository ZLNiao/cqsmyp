import jwt from 'jsonwebtoken'

/**
 * 管理员鉴权中间件
 * JWT payload 中必须有 role: 'admin' 或 'super'
 */
export function requireAdmin(req, res, next) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录' })
  }
  try {
    const token = auth.slice(7)
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (payload.role !== 'admin' && payload.role !== 'super') {
      return res.status(403).json({ code: 403, message: '无管理员权限' })
    }
    req.admin = payload
    next()
  } catch {
    res.status(401).json({ code: 401, message: '登录已过期' })
  }
}

/** super 管理员（用于敏感操作如删账号） */
export function requireSuperAdmin(req, res, next) {
  requireAdmin(req, res, () => {
    if (req.admin.role !== 'super') {
      return res.status(403).json({ code: 403, message: '需超级管理员权限' })
    }
    next()
  })
}
