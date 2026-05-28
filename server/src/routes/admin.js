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



// =============================================================
// 高级分析（漏斗 / 留存 / 收入指标 / 用户分布）
// =============================================================

/**
 * GET /api/admin/funnel?days=30
 * 转化漏斗：注册 → 完成分析 → 进入订阅页 → 付费
 */
router.get('/funnel', requireAdmin, async (req, res, next) => {
  try {
    const days = Math.min(180, Math.max(1, parseInt(req.query.days) || 30))
    const since = `DATE_SUB(NOW(), INTERVAL ${days} DAY)`

    const [{ totalUsers }] = await query(
      `SELECT COUNT(*) AS totalUsers FROM users WHERE created_at >= ${since}`
    )
    const [{ analyzedUsers }] = await query(
      `SELECT COUNT(DISTINCT user_id) AS analyzedUsers FROM analyses WHERE created_at >= ${since}`
    )
    // 进入订阅页 ≈ 创建过订单（pending + paid）
    const [{ viewedSubscribe }] = await query(
      `SELECT COUNT(DISTINCT user_id) AS viewedSubscribe FROM orders WHERE created_at >= ${since}`
    )
    const [{ paidUsers }] = await query(
      `SELECT COUNT(DISTINCT user_id) AS paidUsers FROM orders WHERE status = 'paid' AND created_at >= ${since}`
    )

    const stages = [
      { name: '① 注册用户', count: totalUsers, color: '#8B5CF6' },
      { name: '② 完成分析', count: analyzedUsers, color: '#A855F7' },
      { name: '③ 查看订阅', count: viewedSubscribe, color: '#D946EF' },
      { name: '④ 付费转化', count: paidUsers, color: '#EC4899' }
    ]

    // 计算转化率
    stages.forEach((s, i) => {
      if (i === 0) {
        s.conversionRate = 100
        s.dropoff = 0
      } else {
        const prev = stages[i - 1].count || 1
        s.conversionRate = +((s.count / prev) * 100).toFixed(1)
        s.dropoff = stages[i - 1].count - s.count
      }
    })

    res.json({ code: 0, data: { stages, days } })
  } catch (e) {
    next(e)
  }
})

/**
 * GET /api/admin/retention?weeks=8
 * 留存矩阵：按周分组的 cohort，看每个 cohort 的 D0/D1+/D7+/D30+ 留存
 */
router.get('/retention', requireAdmin, async (req, res, next) => {
  try {
    const weeks = Math.min(16, Math.max(2, parseInt(req.query.weeks) || 8))

    // 一次 JOIN 出全部数据：把 user 按周 cohort 分组，统计每个 cohort 在 N 天后的活跃情况
    // 活跃定义：用户进行过 analyses 操作
    const rows = await query(
      `
      SELECT
        DATE(DATE_SUB(u.created_at, INTERVAL DAYOFWEEK(u.created_at) - 1 DAY)) AS cohort,
        COUNT(DISTINCT u.id) AS cohort_size,
        COUNT(DISTINCT CASE WHEN DATEDIFF(a.created_at, u.created_at) = 0 THEN a.user_id END) AS d0,
        COUNT(DISTINCT CASE WHEN DATEDIFF(a.created_at, u.created_at) BETWEEN 1 AND 6 THEN a.user_id END) AS d1_6,
        COUNT(DISTINCT CASE WHEN DATEDIFF(a.created_at, u.created_at) BETWEEN 7 AND 29 THEN a.user_id END) AS d7_29,
        COUNT(DISTINCT CASE WHEN DATEDIFF(a.created_at, u.created_at) >= 30 THEN a.user_id END) AS d30_plus
      FROM users u
      LEFT JOIN analyses a ON a.user_id = u.id
      WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL ${weeks} WEEK)
      GROUP BY cohort
      ORDER BY cohort DESC
      LIMIT ${weeks}
      `
    )

    // 转换成留存率（百分比）
    const matrix = rows.map((r) => {
      const size = r.cohort_size || 1
      return {
        cohort: r.cohort,
        size: r.cohort_size,
        d0: r.cohort_size > 0 ? +((r.d0 / size) * 100).toFixed(1) : 0,
        d1_6: r.cohort_size > 0 ? +((r.d1_6 / size) * 100).toFixed(1) : 0,
        d7_29: r.cohort_size > 0 ? +((r.d7_29 / size) * 100).toFixed(1) : 0,
        d30_plus: r.cohort_size > 0 ? +((r.d30_plus / size) * 100).toFixed(1) : 0
      }
    })

    res.json({ code: 0, data: { matrix, weeks } })
  } catch (e) {
    next(e)
  }
})

/**
 * GET /api/admin/revenue-metrics
 * 收入核心指标：ARPU / ARPPU / LTV / 付费转化率
 */
router.get('/revenue-metrics', requireAdmin, async (req, res, next) => {
  try {
    const [{ totalUsers }] = await query('SELECT COUNT(*) AS totalUsers FROM users')
    const [{ payingUsers }] = await query(
      "SELECT COUNT(DISTINCT user_id) AS payingUsers FROM orders WHERE status = 'paid'"
    )
    const [{ totalRevenue }] = await query(
      "SELECT IFNULL(SUM(amount), 0) AS totalRevenue FROM orders WHERE status = 'paid'"
    )
    // 各套餐订单分布
    const planRevenue = await query(
      `SELECT plan, COUNT(*) AS orders, IFNULL(SUM(amount), 0) AS revenue
       FROM orders WHERE status = 'paid'
       GROUP BY plan`
    )
    // 各支付方式
    const payMethodRevenue = await query(
      `SELECT pay_method, COUNT(*) AS orders, IFNULL(SUM(amount), 0) AS revenue
       FROM orders WHERE status = 'paid'
       GROUP BY pay_method`
    )

    const arpu = totalUsers > 0 ? Number(totalRevenue) / totalUsers : 0
    const arppu = payingUsers > 0 ? Number(totalRevenue) / payingUsers : 0
    const conversionRate = totalUsers > 0 ? (payingUsers / totalUsers) * 100 : 0
    // LTV 估算：基于经验值，假设平均续订 1.7 个周期（行业平均）
    const ltv = arppu * 1.7

    res.json({
      code: 0,
      data: {
        totalUsers,
        payingUsers,
        totalRevenue: Number(totalRevenue),
        arpu: +arpu.toFixed(2),
        arppu: +arppu.toFixed(2),
        ltv: +ltv.toFixed(2),
        conversionRate: +conversionRate.toFixed(2),
        planRevenue: planRevenue.map((p) => ({ ...p, revenue: Number(p.revenue) })),
        payMethodRevenue: payMethodRevenue.map((p) => ({ ...p, revenue: Number(p.revenue) }))
      }
    })
  } catch (e) {
    next(e)
  }
})

/**
 * GET /api/admin/distribution?days=30
 * 用户分布：脸型 / 色彩季型 / 妆容偏好 + 时段活跃度
 */
router.get('/distribution', requireAdmin, async (req, res, next) => {
  try {
    const days = Math.min(180, Math.max(1, parseInt(req.query.days) || 30))
    const since = `DATE_SUB(NOW(), INTERVAL ${days} DAY)`

    // 脸型分布
    const faceShapes = await query(
      `SELECT face_shape AS name, COUNT(*) AS value
       FROM analyses
       WHERE created_at >= ${since} AND face_shape IS NOT NULL AND face_shape != ''
       GROUP BY face_shape ORDER BY value DESC`
    )

    // 色彩季型分布
    const skinTones = await query(
      `SELECT skin_tone AS name, COUNT(*) AS value
       FROM analyses
       WHERE created_at >= ${since} AND skin_tone IS NOT NULL AND skin_tone != ''
       GROUP BY skin_tone ORDER BY value DESC`
    )

    // AI 妆容偏好
    const makeupStyles = await query(
      `SELECT style AS name, COUNT(*) AS value
       FROM ai_makeups
       WHERE created_at >= ${since}
       GROUP BY style ORDER BY value DESC`
    )

    // 24 小时活跃度（按分析次数）
    const hourlyRaw = await query(
      `SELECT HOUR(created_at) AS hour, COUNT(*) AS count
       FROM analyses
       WHERE created_at >= ${since}
       GROUP BY HOUR(created_at)`
    )
    // 补全 0~23 小时
    const hourMap = Object.fromEntries(hourlyRaw.map((r) => [r.hour, r.count]))
    const hourlyActivity = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: Number(hourMap[h] || 0)
    }))

    res.json({
      code: 0,
      data: { faceShapes, skinTones, makeupStyles, hourlyActivity, days }
    })
  } catch (e) {
    next(e)
  }
})
