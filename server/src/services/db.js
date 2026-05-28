import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'glamup',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'glamup',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
})

/** 简化的查询方法 */
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params)
  return rows
}

export default pool
