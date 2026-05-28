/**
 * 基于百度 landmark150 关键点几何运算推算五官特征
 * 不需要机器学习，纯几何阈值规则
 *
 * landmark150 关键点参考：
 * https://ai.baidu.com/ai-doc/FACE/yk37c1u4t#landmark150
 */

/** 计算两点距离 */
function dist(p1, p2) {
  if (!p1 || !p2) return 0
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
}

/** 计算三点形成的角度（弧度） */
function angle(p1, p2, p3) {
  if (!p1 || !p2 || !p3) return 0
  const a = dist(p1, p2)
  const b = dist(p2, p3)
  const c = dist(p1, p3)
  return Math.acos((a * a + b * b - c * c) / (2 * a * b))
}

/** 脸型描述映射 */
const FACE_SHAPE_MAP = {
  square: {
    label: '方脸',
    feature: '下颌方正、棱角分明',
    suit: '柔和弧形眉、椭圆形发型可修饰轮廓'
  },
  triangle: {
    label: '三角脸',
    feature: '上窄下宽，下颌较饱满',
    suit: '挑眉 + 高光颧骨可平衡比例'
  },
  oval: {
    label: '鹅蛋脸',
    feature: '比例匀称、线条流畅',
    suit: '几乎适合所有妆容和发型'
  },
  heart: {
    label: '心形脸',
    feature: '额头较宽、下巴尖细',
    suit: '柔和眉形、低位腮红、浅色唇妆'
  },
  round: {
    label: '圆脸',
    feature: '脸颊饱满、轮廓柔和',
    suit: '上挑眉 + 阴影修饰下颌、显瘦发型'
  }
}

/** 推算脸型描述（百度返回 face_shape 是数组，按概率排序） */
export function describeFaceShape(faceShape) {
  if (Array.isArray(faceShape)) {
    const top = [...faceShape].sort((a, b) => b.probability - a.probability)[0]
    return {
      ...FACE_SHAPE_MAP[top.type],
      type: top.type,
      probability: top.probability
    }
  }
  if (typeof faceShape === 'string') {
    return { ...FACE_SHAPE_MAP[faceShape], type: faceShape, probability: 1 }
  }
  return { ...FACE_SHAPE_MAP.oval, type: 'oval', probability: 0.5 }
}

/**
 * 从 landmark150 提取五官特征
 * @param {Object} lm - landmark150 对象
 * @returns {Array<{emoji, name, value}>}
 */
export function analyzeFeatures(lm) {
  if (!lm) return defaultFeatures()
  return [
    { emoji: '👁️', name: '眼型', value: classifyEye(lm) },
    { emoji: '✏️', name: '眉形', value: classifyBrow(lm) },
    { emoji: '💋', name: '唇形', value: classifyLip(lm) },
    { emoji: '👃', name: '鼻型', value: classifyNose(lm) }
  ]
}

function defaultFeatures() {
  return [
    { emoji: '👁️', name: '眼型', value: '杏眼' },
    { emoji: '✏️', name: '眉形', value: '标准眉' },
    { emoji: '💋', name: '唇形', value: 'M 形唇' },
    { emoji: '👃', name: '鼻型', value: '直鼻' }
  ]
}

/**
 * 眼型分类
 * 依据：眼睛长宽比 + 眼角倾斜度
 * - 杏眼：标准比例，微微上扬
 * - 桃花眼：圆润饱满，水汪汪
 * - 丹凤眼：细长上挑
 * - 细长眼：长而扁
 * - 上扬眼：眼尾明显高于眼头
 * - 下垂眼：眼尾低于眼头
 */
function classifyEye(lm) {
  const lc = lm.left_eye_left_corner
  const rc = lm.left_eye_right_corner
  const top = lm.left_eye_top
  const bot = lm.left_eye_bottom
  if (!lc || !rc || !top || !bot) return '杏眼'

  const width = dist(lc, rc)
  const height = dist(top, bot)
  if (width === 0) return '杏眼'

  const ratio = height / width
  // 眼角倾斜度（注意：图像坐标系 y 向下为正，所以 rc.y < lc.y 才是上扬）
  const tilt = (lc.y - rc.y) / width

  if (ratio > 0.42 && tilt > 0.05) return '丹凤眼'
  if (ratio >= 0.38) return '桃花眼'
  if (ratio < 0.26) return '细长眼'
  if (tilt > 0.08) return '上扬眼'
  if (tilt < -0.06) return '下垂眼'
  return '杏眼'
}

/**
 * 眉形分类
 * 依据：眉峰相对于眉头/眉尾的弧度
 * - 一字眉：几乎水平
 * - 柳叶眉：明显弧度
 * - 标准眉：自然弧度
 * - 挑眉：眉峰较高且靠后
 */
function classifyBrow(lm) {
  const head = lm.left_eyebrow_left_corner
  const peak = lm.left_eyebrow_upper_middle
  const tail = lm.left_eyebrow_right_corner
  if (!head || !peak || !tail) return '标准眉'

  const len = dist(head, tail)
  if (len === 0) return '标准眉'

  // 弧度：峰点到底线（眉头-眉尾连线）的垂直距离
  // 图像坐标系 y 向下，眉峰更高 = peak.y 更小
  const baseY = (head.y + tail.y) / 2
  const arch = (baseY - peak.y) / len // 归一化弧度
  // 眉峰位置（0=眉头, 1=眉尾）
  const peakPos = (peak.x - head.x) / (tail.x - head.x)

  if (arch < 0.05) return '一字眉'
  if (arch > 0.18) return '柳叶眉'
  if (peakPos > 0.6 && arch > 0.12) return '挑眉'
  return '标准眉'
}

/**
 * 唇形分类
 * 依据：嘴巴长宽比 + 上唇 M 形度
 * - 厚唇：高度大
 * - 薄唇：高度小
 * - 性感唇：宽且厚
 * - 樱桃唇：小巧饱满
 * - M 形唇：上唇有明显凹陷
 */
function classifyLip(lm) {
  const upTop = lm.mouth_upperlip_top
  const upMid = lm.mouth_upperlip_top_middle
  const lc = lm.mouth_left_corner
  const rc = lm.mouth_right_corner
  const lowBot = lm.mouth_lowerlip_bottom
  if (!upTop || !lc || !rc || !lowBot) return 'M 形唇'

  const width = dist(lc, rc)
  const height = dist(upTop, lowBot)
  if (width === 0) return 'M 形唇'

  const ratio = height / width

  // 樱桃唇：嘴巴宽度小但比例正常
  // 性感唇：宽且厚
  if (ratio > 0.42 && width > 0) return '厚唇'
  if (ratio < 0.22) return '薄唇'

  // M 形唇：检查上唇中点凹陷
  if (upMid && upTop) {
    const dipDepth = upMid.y - upTop.y
    if (dipDepth > height * 0.15) return 'M 形唇'
  }

  return '标准唇'
}

/**
 * 鼻型分类
 * 依据：鼻翼宽度 / 脸宽 比例 + 鼻梁高低
 * - 直鼻：标准
 * - 蒜头鼻：鼻翼较宽
 * - 小巧鼻：鼻翼窄小
 * - 鹰钩鼻：鼻头下钩
 */
function classifyNose(lm) {
  const left = lm.nose_left
  const right = lm.nose_right
  const tip = lm.nose_tip
  const middle = lm.nose_middle_contour
  // 用脸颊点估算脸宽
  const cheekL = lm.cheek_left_1 || lm.left_eye_left_corner
  const cheekR = lm.cheek_right_1 || lm.right_eye_right_corner

  if (!left || !right || !cheekL || !cheekR) return '直鼻'

  const noseWidth = dist(left, right)
  const faceWidth = dist(cheekL, cheekR)
  if (faceWidth === 0) return '直鼻'

  const ratio = noseWidth / faceWidth

  if (ratio > 0.32) return '蒜头鼻'
  if (ratio < 0.20) return '小巧鼻'
  return '直鼻'
}
