/**
 * 管理后台 API
 * 路径前缀：/api/admin
 */
import { Router } from 'express'
import multer from 'multer'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { requireAdmin, requireSuperAdmin } from '../middleware/admin-auth.js'
import { query } from '../services/db.js'
import { addCelebrity, removeCelebrity, listCelebrities } from '../services/celebs.js'
import { compressImage } from '../services/image.js'
import logger from '../utils/logger.js'

const router = Router()
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } })

// =============================================================
// 登录
// =============================================================

/** POST /api/admin/login - 管理员登录 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '请输入用户名和密码' })
    }

    const rows = await query(
      'SELECT * FROM admin_users WHERE username = ? LIMIT 1',
      [username]
    )
    const admin = rows[0]
    if (!admin) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' })
    }

    const match = bcrypt.compareSync(password, admin.password_hash)
    if (!match) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' })
    }

    const token = jwt.sign(
      { adminId: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    )

    // 更新最后登录时间
    query('UPDATE admin_users SET last_login_at = NOW() WHERE id = ?', [admin.id])
      .catch(() => {})

    res.json({
      code: 0,
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          realName: admin.real_name,
          role: admin.role
        }
      }
    })
  } catch (e) { next(e) }
})

/** GET /api/admin/profile - 当前管理员信息 */
router.get('/profile', requireAdmin, (req, res) => {
  res.json({
    code: 0,
    data: {
      id: req.admin.adminId,
      username: req.admin.username,
      role: req.admin.role
    }
  })
})

// =============================================================
// 仪表盘
// =============================================================

/** GET /api/admin/dashboard - 关键统计指标 */
router.get('/dashboard', requireAdmin, async (req, res, next) => {
  try {
    // 用户统计
    const [{ total: totalUsers }] = await query('SELECT COUNT(*) AS total FROM users')
    const [{ total: todayUsers }] = await query(
      "SELECT COUNT(*) AS total FROM users WHERE DATE(created_at) = CURDATE()"
    )
    const [{ total: vipUsers }] = await query(
      'SELECT COUNT(*) AS total FROM users WHERE is_vip = 1 AND vip_expiry > NOW()'
    )

    // 订单统计
    const [{ total: paidOrders }] = await query(
      "SELECT COUNT(*) AS total FROM orders WHERE status = 'paid'"
    )
    const [{ revenue }] = await query(
      "SELECT IFNULL(SUM(amount), 0) AS revenue FROM orders WHERE status = 'paid'"
    )
    const [{ todayRevenue }] = await query(
      `SELECT IFNULL(SUM(amount), 0) AS todayRevenue FROM orders
       WHERE status = 'paid' AND DATE(paid_at) = CURDATE()`
    )

    // 分析统计
    const [{ total: totalAnalyses }] = await query('SELECT COUNT(*) AS total FROM analyses')
    const [{ total: todayAnalyses }] = await query(
      "SELECT COUNT(*) AS total FROM analyses WHERE DATE(created_at) = CURDATE()"
    )

    // 近 7 天每日新增用户
    const dailyUsers = await query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM users WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE(created_at) ORDER BY date`
    )

    // 近 7 天每日营收
    const dailyRevenue = await query(
      `SELECT DATE(paid_at) AS date, IFNULL(SUM(amount), 0) AS revenue
       FROM orders WHERE status = 'paid'
         AND paid_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE(paid_at) ORDER BY date`
    )

    res.json({
      code: 0,
      data: {
        users: { total: totalUsers, today: todayUsers, vip: vipUsers },
        orders: { paid: paidOrders, revenue: Number(revenue), todayRevenue: Number(todayRevenue) },
        analyses: { total: totalAnalyses, today: todayAnalyses },
        charts: { dailyUsers, dailyRevenue }
      }
    })
  } catch (e) { next(e) }
})

// =============================================================
// 用户管理
// =============================================================

/** GET /api/admin/users - 用户列表（分页 + 搜索） */
router.get('/users', requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const pageSize = Math.min(100, parseInt(req.query.pageSize) || 20)
    const offset = (page - 1) * pageSize
    const keyword = (req.query.keyword || '').trim()

    let where = '1=1'
    const params = []
    if (keyword) {
      where += ' AND (phone LIKE ? OR nickname LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    const [{ total }] = await query(`SELECT COUNT(*) AS total FROM users WHERE ${where}`, params)
    const list = await query(
      `SELECT id, phone, nickname, avatar, is_vip, vip_expiry, created_at
       FROM users WHERE ${where}
       ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )

    res.json({ code: 0, data: { list, total, page, pageSize } })
  } catch (e) { next(e) }
})

/** PUT /api/admin/users/:id/vip - 手动赠送/取消 VIP */
router.put('/users/:id/vip', requireAdmin, async (req, res, next) => {
  try {
    const { days } = req.body  // 正数赠送，0 取消
    const userId = req.params.id

    if (days > 0) {
      // 赠送：从当前到期日加上 days，没有就从现在加
      const [user] = await query('SELECT vip_expiry FROM users WHERE id = ?', [userId])
      if (!user) return res.status(404).json({ code: 404, message: '用户不存在' })
      const now = new Date()
      const base = (user.vip_expiry && new Date(user.vip_expiry) > now)
        ? new Date(user.vip_expiry) : now
      const expiry = new Date(base.getTime() + days * 86400_000)
      await query('UPDATE users SET is_vip = 1, vip_expiry = ? WHERE id = ?', [expiry, userId])
      logger.info(`管理员 ${req.admin.username} 给用户 ${userId} 赠送 ${days} 天 VIP`)
    } else {
      await query('UPDATE users SET is_vip = 0, vip_expiry = NULL WHERE id = ?', [userId])
      logger.info(`管理员 ${req.admin.username} 取消用户 ${userId} 的 VIP`)
    }
    res.json({ code: 0, data: {} })
  } catch (e) { next(e) }
})

// =============================================================
// 订单管理
// =============================================================

/** GET /api/admin/orders - 订单列表 */
router.get('/orders', requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const pageSize = Math.min(100, parseInt(req.query.pageSize) || 20)
    const offset = (page - 1) * pageSize
    const status = req.query.status
    const keyword = (req.query.keyword || '').trim()

    let where = '1=1'
    const params = []
    if (status) {
      where += ' AND o.status = ?'
      params.push(status)
    }
    if (keyword) {
      where += ' AND (o.order_no LIKE ? OR u.phone LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    const [{ total }] = await query(
      `SELECT COUNT(*) AS total FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       WHERE ${where}`,
      params
    )
    const list = await query(
      `SELECT o.id, o.order_no, o.user_id, u.phone, u.nickname,
              o.plan, o.amount, o.status, o.pay_method,
              o.transaction_id, o.paid_at, o.created_at
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       WHERE ${where}
       ORDER BY o.id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )

    res.json({ code: 0, data: { list, total, page, pageSize } })
  } catch (e) { next(e) }
})

// =============================================================
// 分析记录
// =============================================================

/** GET /api/admin/analyses - 分析记录列表 */
router.get('/analyses', requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const pageSize = Math.min(100, parseInt(req.query.pageSize) || 20)
    const offset = (page - 1) * pageSize

    const [{ total }] = await query('SELECT COUNT(*) AS total FROM analyses')
    const list = await query(
      `SELECT a.id, a.user_id, u.phone, u.nickname,
              a.face_shape, a.skin_tone, a.created_at
       FROM analyses a
       LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.id DESC LIMIT ? OFFSET ?`,
      [pageSize, offset]
    )

    res.json({ code: 0, data: { list, total, page, pageSize } })
  } catch (e) { next(e) }
})

// =============================================================
// 明星人脸库管理
// =============================================================

/** GET /api/admin/celebrities - 明星列表 */
router.get('/celebrities', requireAdmin, async (req, res, next) => {
  try {
    const list = await listCelebrities()
    res.json({ code: 0, data: { list } })
  } catch (e) { next(e) }
})

/**
 * POST /api/admin/celebrities - 新增明星
 * Form-Data: file + baiduUserId + name + emoji + bg + faceShape
 */
router.post('/celebrities', requireAdmin, upload.single('file'), async (req, res, next) => {
  try {
    const buffer = req.file?.buffer
    if (!buffer) return res.status(400).json({ code: 400, message: '请上传明星照片' })

    const { baiduUserId, name, emoji, bg, faceShape } = req.body
    if (!baiduUserId || !name) {
      return res.status(400).json({ code: 400, message: '缺少必要字段' })
    }
    if (!/^[a-zA-Z0-9_]+$/.test(baiduUserId)) {
      return res.status(400).json({ code: 400, message: 'baiduUserId 只能包含字母数字下划线' })
    }

    const compressed = await compressImage(buffer)
    await addCelebrity({
      baiduUserId, name, emoji, bg, faceShape,
      imageBuffer: compressed
    })

    logger.info(`管理员 ${req.admin.username} 添加明星 ${name}（${baiduUserId}）`)
    res.json({ code: 0, data: {} })
  } catch (e) {
    logger.error('添加明星失败:', e.message)
    next(e)
  }
})

/** DELETE /api/admin/celebrities/:baiduUserId */
router.delete('/celebrities/:baiduUserId', requireSuperAdmin, async (req, res, next) => {
  try {
    await removeCelebrity(req.params.baiduUserId)
    res.json({ code: 0, data: {} })
  } catch (e) { next(e) }
})

export default router
