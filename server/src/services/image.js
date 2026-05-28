/**
 * 图片处理工具
 * - compressImage: 压缩图片（尺寸 + 质量），减少传给百度 AI 的字节数
 * - hashBuffer: 计算图片 MD5（用于缓存 key）
 */
import sharp from 'sharp'
import crypto from 'node:crypto'
import logger from '../utils/logger.js'

/**
 * 压缩图片：缩到 800x800 内 + JPEG 85%
 * 百度 AI 实测：800px 完全够用，能省 60~80% 带宽 + API 时间
 *
 * @param {Buffer} buffer - 原图
 * @returns {Promise<Buffer>}
 */
export async function compressImage(buffer) {
  try {
    const meta = await sharp(buffer).metadata()
    const compressed = await sharp(buffer)
      // 旋转：处理 iPhone 拍的照片自带 EXIF 旋转标记
      .rotate()
      // 缩放：长边不超过 800
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer()

    logger.info(
      `[compress] ${meta.width}x${meta.height} ${(buffer.length / 1024).toFixed(1)}KB → ` +
      `${(compressed.length / 1024).toFixed(1)}KB ` +
      `(省 ${Math.round((1 - compressed.length / buffer.length) * 100)}%)`
    )
    return compressed
  } catch (e) {
    logger.warn('图片压缩失败，使用原图：' + e.message)
    return buffer
  }
}

/** 计算 buffer 的 MD5 */
export function hashBuffer(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex')
}
