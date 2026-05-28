/**
 * 明星相似度服务
 * 1. 维护明星元信息（数据库 celebrities 表）
 * 2. 调百度 AI 人脸搜索 V3 找 top N
 * 3. 用 baidu_user_id 关联回元信息
 */
import { searchInGroup, addFaceToGroup, removeFaceFromGroup, createFaceGroup } from './baidu-ai.js'
import { query } from './db.js'
import logger from '../utils/logger.js'

/**
 * 搜索 top 3 明星相似度
 * @param {Buffer} imageBuffer - 用户上传的图（已压缩）
 * @param {string} faceShape - 用户脸型（type 形式，如 'heart'/'oval'）
 * @returns {Promise<Array>} [{ name, emoji, sim, bg }]
 */
export async function searchCelebs(imageBuffer, faceShape) {
  // 调百度搜索
  const matches = await searchInGroup(imageBuffer, 3)

  if (matches.length === 0) {
    logger.warn('百度返回 0 个明星匹配，可能是人脸库为空')
    throw new Error('明星库为空或无匹配')
  }

  // 从 DB 拉元信息
  const userIds = matches.map((m) => m.user_id)
  const placeholders = userIds.map(() => '?').join(',')
  const rows = await query(
    `SELECT baidu_user_id, name, emoji, bg FROM celebrities
     WHERE baidu_user_id IN (${placeholders}) AND enabled = 1`,
    userIds
  )

  const meta = Object.fromEntries(rows.map((r) => [r.baidu_user_id, r]))

  // 组装返回
  return matches.map((m) => {
    const info = meta[m.user_id] || { name: '神秘明星', emoji: '👤', bg: 'linear-gradient(135deg, #DDD6FE, #8B5CF6)' }
    return {
      name: info.name,
      emoji: info.emoji,
      bg: info.bg,
      sim: Math.round(m.score)
    }
  })
}

/**
 * 添加明星（管理员调用）
 * 1. 添加到百度 FaceSet
 * 2. 写入 celebrities 表
 */
export async function addCelebrity({ baiduUserId, name, emoji, bg, faceShape, imageBuffer, imageUrl }) {
  // 先确保分组存在
  await createFaceGroup().catch(() => {})

  // 加入百度
  await addFaceToGroup(imageBuffer, baiduUserId, { name })

  // 写 DB
  await query(
    `INSERT INTO celebrities (baidu_user_id, name, emoji, bg, face_shape, image_url)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name), emoji = VALUES(emoji), bg = VALUES(bg),
       face_shape = VALUES(face_shape), image_url = VALUES(image_url), enabled = 1`,
    [baiduUserId, name, emoji || '👩', bg || 'linear-gradient(135deg, #FBCFE8, #F472B6)', faceShape || null, imageUrl || null]
  )
}

/** 删除明星 */
export async function removeCelebrity(baiduUserId) {
  await removeFaceFromGroup(baiduUserId).catch((e) => {
    logger.warn('从百度删除失败：' + e.message)
  })
  await query('UPDATE celebrities SET enabled = 0 WHERE baidu_user_id = ?', [baiduUserId])
}

/** 列出所有启用的明星 */
export async function listCelebrities() {
  return query(
    `SELECT id, baidu_user_id, name, emoji, bg, face_shape, image_url, created_at
     FROM celebrities WHERE enabled = 1 ORDER BY id DESC`
  )
}
