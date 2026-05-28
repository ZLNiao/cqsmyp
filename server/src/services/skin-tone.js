/**
 * 肤色分析
 * 步骤：
 * 1. 用百度 landmark150 定位脸颊区域
 * 2. 用 sharp 提取该区域像素
 * 3. 计算 RGB 均值 → HSV
 * 4. 判断冷暖调（undertone）+ 深浅（depth）
 */
import sharp from 'sharp'
import logger from '../utils/logger.js'

/**
 * 分析肤色
 * @param {Buffer} imageBuffer
 * @param {Object} landmark150 - 百度返回的关键点（用于定位脸颊）
 * @returns {Promise<{rgb, hsv, undertone, depth}>}
 */
export async function analyzeSkinTone(imageBuffer, landmark150) {
  try {
    const image = sharp(imageBuffer)
    const meta = await image.metadata()
    const w = meta.width
    const h = meta.height

    const region = getCheekRegion(landmark150, w, h)

    // 提取该区域像素（去掉 alpha 通道）
    const { data, info } = await image
      .extract(region)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    // 计算 RGB 均值（过滤异常值：太暗的阴影、太亮的反光）
    let rSum = 0, gSum = 0, bSum = 0, count = 0
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b
      // 过滤异常值（太暗或太亮可能是阴影/高光）
      if (luminance < 50 || luminance > 240) continue
      rSum += r
      gSum += g
      bSum += b
      count += 1
    }

    if (count < 100) {
      // 像素样本太少，用全部
      return fallbackAnalyze(data, info)
    }

    const r = Math.round(rSum / count)
    const g = Math.round(gSum / count)
    const b = Math.round(bSum / count)

    return classify(r, g, b)
  } catch (e) {
    logger.error('肤色分析失败', e.message)
    // 返回中性默认值
    return {
      rgb: { r: 220, g: 200, b: 180 },
      hsv: { h: 30, s: 0.18, v: 0.86 },
      undertone: 'neutral',
      depth: 'medium'
    }
  }
}

/** 根据 landmark150 推算脸颊采样区域 */
function getCheekRegion(lm, imgW, imgH) {
  // 默认中心 25% 区域
  const fallback = {
    left: Math.floor(imgW * 0.375),
    top: Math.floor(imgH * 0.45),
    width: Math.floor(imgW * 0.25),
    height: Math.floor(imgH * 0.2)
  }

  if (!lm) return fallback

  // 用左脸颊点位（cheek_left_1 ~ cheek_left_11）和鼻翼定位
  const cheekPts = []
  for (let i = 1; i <= 11; i++) {
    if (lm[`cheek_left_${i}`]) cheekPts.push(lm[`cheek_left_${i}`])
    if (lm[`cheek_right_${i}`]) cheekPts.push(lm[`cheek_right_${i}`])
  }

  if (cheekPts.length === 0) return fallback

  // 取脸颊点位的包围盒中心
  const xs = cheekPts.map((p) => p.x)
  const ys = cheekPts.map((p) => p.y)
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2

  const sampleW = Math.floor(imgW * 0.15)
  const sampleH = Math.floor(imgH * 0.1)

  return {
    left: clamp(Math.floor(cx - sampleW / 2), 0, imgW - sampleW),
    top: clamp(Math.floor(cy - sampleH / 2), 0, imgH - sampleH),
    width: sampleW,
    height: sampleH
  }
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

/** 简单回退分析（直接用所有像素均值） */
function fallbackAnalyze(data, info) {
  let r = 0, g = 0, b = 0
  const count = data.length / info.channels
  for (let i = 0; i < data.length; i += info.channels) {
    r += data[i]; g += data[i + 1]; b += data[i + 2]
  }
  return classify(Math.round(r / count), Math.round(g / count), Math.round(b / count))
}

/** RGB → HSV → 冷暖调 + 深浅分类 */
function classify(r, g, b) {
  const hsv = rgbToHsv(r, g, b)

  // 冷暖调判断：
  // 暖调：偏黄/橙/红（H 0~60 或 H > 320）
  // 冷调：偏蓝/紫（H 200~280）
  // 中性：之间
  let undertone
  if ((hsv.h >= 0 && hsv.h < 60) || hsv.h > 320) {
    undertone = 'warm'
  } else if (hsv.h >= 200 && hsv.h < 280) {
    undertone = 'cool'
  } else {
    // 通过 R-B 差进一步判断
    const diff = r - b
    if (diff > 25) undertone = 'warm'
    else if (diff < -10) undertone = 'cool'
    else undertone = 'neutral'
  }

  // 深浅：用明度（V）+ 整体亮度
  let depth
  if (hsv.v > 0.85 && r > 220) depth = 'fair'           // 白皙
  else if (hsv.v > 0.75 || r > 200) depth = 'medium-fair' // 自然白
  else if (hsv.v > 0.6) depth = 'medium'                // 健康麦色
  else depth = 'deep'                                    // 深棕

  return {
    rgb: { r, g, b },
    hsv: { h: Math.round(hsv.h), s: +hsv.s.toFixed(2), v: +hsv.v.toFixed(2) },
    undertone,
    depth
  }
}

/** RGB(0-255) → HSV(h: 0-360, s: 0-1, v: 0-1) */
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const v = max
  const d = max - min
  const s = max === 0 ? 0 : d / max

  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s, v }
}
