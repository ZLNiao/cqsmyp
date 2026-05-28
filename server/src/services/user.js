import { query } from './db.js'

/** 查询/创建用户 */
export async function findOrCreateUser(phone) {
  const rows = await query('SELECT * FROM users WHERE phone = ? LIMIT 1', [phone])
  if (rows.length > 0) return rows[0]

  const nickname = '美人' + phone.slice(-4)
  const result = await query(
    'INSERT INTO users (phone, nickname) VALUES (?, ?)',
    [phone, nickname]
  )
  return { id: result.insertId, phone, nickname, is_vip: 0 }
}

export async function getUserById(id) {
  const rows = await query('SELECT * FROM users WHERE id = ?', [id])
  return rows[0]
}

/** 开通/续费会员（如未过期，从过期日起加，否则从今天起加）*/
export async function setUserVip(userId, days) {
  const user = await getUserById(userId)
  if (!user) throw new Error('用户不存在')

  const now = new Date()
  const base = (user.is_vip && user.vip_expiry && new Date(user.vip_expiry) > now)
    ? new Date(user.vip_expiry)
    : now

  const expiry = new Date(base.getTime() + days * 86400_000)

  await query(
    'UPDATE users SET is_vip = 1, vip_expiry = ? WHERE id = ?',
    [expiry, userId]
  )
  return expiry
}

export function formatUser(u) {
  return {
    id: u.id,
    phone: u.phone,
    nickname: u.nickname,
    avatar: u.avatar,
    isVip: !!u.is_vip && u.vip_expiry && new Date(u.vip_expiry) > new Date(),
    vipExpiry: u.vip_expiry
  }
}
