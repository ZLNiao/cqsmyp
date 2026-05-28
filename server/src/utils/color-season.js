/**
 * 12 季型色彩分析
 * 经典版：4 大季型（春/夏/秋/冬）
 *
 * 判定逻辑：
 *   暖调 + 高明度        → 春季型（明亮温暖）
 *   暖调 + 低明度        → 秋季型（深沉温润）
 *   冷调 + 中高明度      → 夏季型（柔和温柔）
 *   冷调 + 低/极高明度   → 冬季型（强烈对比）
 */

export const SEASONS = {
  spring: {
    label: '暖调 · 春季型',
    desc: '明亮温暖、活泼俏皮',
    skinType: '暖白皮',
    colors: [
      { name: '珊瑚橙', color: '#FF7F50' },
      { name: '蜜桃粉', color: '#FFB6A3' },
      { name: '暖黄', color: '#FFD580' },
      { name: '嫩绿', color: '#A8D8B9' },
      { name: '天青蓝', color: '#87CEEB' },
      { name: '裸粉', color: '#F4C2C2' }
    ],
    avoid: ['深棕', '黑色', '冷紫']
  },
  summer: {
    label: '冷调 · 夏季型',
    desc: '柔和温柔、浪漫优雅',
    skinType: '冷白皮',
    colors: [
      { name: '玫瑰粉', color: '#F4A6B8' },
      { name: '薰衣草', color: '#B8A6F4' },
      { name: '雾霾蓝', color: '#A6BDD7' },
      { name: '薄荷绿', color: '#A8E6CF' },
      { name: '浅紫', color: '#D8BFD8' },
      { name: '正红', color: '#DC143C' }
    ],
    avoid: ['橙色', '芥末黄', '焦糖色']
  },
  autumn: {
    label: '暖调 · 秋季型',
    desc: '深沉温润、知性成熟',
    skinType: '暖黄皮',
    colors: [
      { name: '大地色', color: '#A78460' },
      { name: '焦糖色', color: '#A0522D' },
      { name: '橄榄绿', color: '#8B8C45' },
      { name: '砖红', color: '#B22222' },
      { name: '芥末黄', color: '#DDA624' },
      { name: '驼色', color: '#C19A6B' }
    ],
    avoid: ['冷粉', '亮蓝', '冰白']
  },
  winter: {
    label: '冷调 · 冬季型',
    desc: '强烈对比、清冷高级',
    skinType: '冷白皮 / 冷黄皮',
    colors: [
      { name: '正红', color: '#DC143C' },
      { name: '宝蓝', color: '#1E3A8A' },
      { name: '酒红', color: '#722F37' },
      { name: '亮黑', color: '#1C1C1C' },
      { name: '冰粉', color: '#FAD0D9' },
      { name: '翠绿', color: '#008B45' }
    ],
    avoid: ['大地色', '橙色', '驼色']
  }
}

/**
 * 根据肤色 undertone + depth 推断季型
 * @param {{undertone, depth, hsv}} skinTone
 * @returns {Object} 季型对象
 */
export function determineSeason(skinTone) {
  const { undertone, depth, hsv } = skinTone
  const v = hsv?.v ?? 0.7

  if (undertone === 'warm') {
    return depth === 'fair' || depth === 'medium-fair' ? SEASONS.spring : SEASONS.autumn
  }

  if (undertone === 'cool') {
    // 冬季对比强：极高 V 或较低 V 都偏冬
    if (depth === 'deep' || v < 0.5 || v > 0.95) return SEASONS.winter
    return SEASONS.summer
  }

  // 中性：根据明度倾向
  if (v > 0.8) return SEASONS.spring
  if (v < 0.6) return SEASONS.autumn
  return SEASONS.summer
}

/** 中文肤色描述 */
export function describeSkin(skinTone) {
  const undertoneCN = { warm: '暖', cool: '冷', neutral: '中性' }[skinTone.undertone] || '中性'
  const depthCN = {
    fair: '白皙',
    'medium-fair': '自然白',
    medium: '健康小麦',
    deep: '深棕'
  }[skinTone.depth] || '自然'
  return `${undertoneCN}调 · ${depthCN}`
}
