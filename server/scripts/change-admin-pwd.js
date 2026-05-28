/**
 * 修改管理员密码
 * 用法：node scripts/change-admin-pwd.js <username> <new-password>
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import pool, { query } from '../src/services/db.js'

async function main() {
  const [, , username, newPwd] = process.argv
  if (!username || !newPwd) {
    console.log('用法：node scripts/change-admin-pwd.js <username> <new-password>')
    process.exit(1)
  }
  if (newPwd.length < 8) {
    console.log('密码至少 8 位')
    process.exit(1)
  }

  const hash = bcrypt.hashSync(newPwd, 10)
  const rows = await query('SELECT id FROM admin_users WHERE username = ?', [username])
  if (rows.length === 0) {
    console.log(`用户 ${username} 不存在`)
    process.exit(1)
  }

  await query('UPDATE admin_users SET password_hash = ? WHERE username = ?', [hash, username])
  console.log(`✅ 用户 ${username} 的密码已更新`)
  await pool.end()
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
