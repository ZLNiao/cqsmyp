/**
 * 大模型妆容生成（DeepSeek / 通义千问）
 */
import axios from 'axios'
import logger from '../utils/logger.js'

/**
 * 根据脸型/肤色/季型/用户信息生成个性化妆容
 */
export async function generateMakeup({ faceShape, season, features, userInfo }) {
  // 未配置 LLM key → 用规则兜底
  if (!process.env.DEEPSEEK_API_KEY) {
    return ruleBasedMakeup({ faceShape, season, features, userInfo })
  }

  const featuresStr = features?.map((f) => `${f.name}：${f.value}`).join('，') || ''
  const colorsStr = season.colors.map((c) => c.name).slice(0, 4).join('、')

  const prompt = `你是专业彩妆师。请为用户生成一套专属妆容方案。

【用户信息】
- 脸型：${faceShape.label}（${faceShape.feature}）
- 色彩季型：${season.label}（${season.desc}）
- 推荐色系：${colorsStr}
- 五官：${featuresStr}
- 年龄段：${userInfo?.age || '25-34'}
- 化妆频率：${userInfo?.makeupFreq || '偶尔'}
- 护肤需求：${(userInfo?.skinNeeds || []).join('、') || '基础保养'}

【输出要求】
- 严格 JSON 格式：{ "title": "...", "steps": ["底妆：...", "眼妆：...", "唇妆：...", "腮红：..."] }
- title 是妆容名（如"通勤优雅妆"、"约会甜心妆"），4~8 字
- 每个 step 一句话，不超过 30 字，要具体到颜色和手法
- 必须结合脸型修饰建议（如圆脸建议侧扫修容）
- 不输出多余解释`

  try {
    const { data } = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
        timeout: 30000
      }
    )

    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('LLM 无返回')

    const parsed = JSON.parse(content)
    if (!parsed.title || !Array.isArray(parsed.steps)) {
      throw new Error('LLM 返回格式错误')
    }
    return parsed
  } catch (e) {
    logger.warn('LLM 生成失败，降级到规则方案：' + e.message)
    return ruleBasedMakeup({ faceShape, season, features, userInfo })
  }
}

/** 规则兜底：根据脸型 + 季型组合查表 */
function ruleBasedMakeup({ faceShape, season }) {
  const seasonKey = Object.keys(SEASON_PRESETS).find((k) => season.label.includes(k))
    ? Object.keys(SEASON_PRESETS).find((k) => season.label.includes(k))
    : '春'

  const preset = SEASON_PRESETS[seasonKey] || SEASON_PRESETS['春']
  const faceTip = FACE_SHAPE_TIPS[faceShape.type] || FACE_SHAPE_TIPS.oval

  return {
    title: preset.title,
    steps: [
      `底妆：${preset.base}`,
      `眼妆：${preset.eye}`,
      `唇妆：${preset.lip}`,
      `腮红：${faceTip}`
    ]
  }
}

const SEASON_PRESETS = {
  春: {
    title: '元气活力妆',
    base: '轻薄水润粉底 + 局部遮瑕，打造透亮肌',
    eye: '蜜桃色眼影 + 棕色眼线，自然显大眼',
    lip: '珊瑚橙水润唇釉，少女气十足'
  },
  夏: {
    title: '温柔氧气妆',
    base: '清爽哑光粉底，妆感轻薄持久',
    eye: '玫瑰粉眼影 + 黑灰色眼线，温柔不张扬',
    lip: '豆沙粉唇釉，气质温婉'
  },
  秋: {
    title: '复古港风妆',
    base: '中度遮瑕粉底，肌肤丝绒质感',
    eye: '大地色眼影 + 棕黑眼线，深邃眼神',
    lip: '砖红色雾面唇膏，复古高级'
  },
  冬: {
    title: '清冷御姐妆',
    base: '哑光高遮瑕底妆，强调骨相',
    eye: '冷棕烟熏眼影 + 黑色眼线，气场全开',
    lip: '正红色雾面唇釉，纯欲并存'
  }
}

const FACE_SHAPE_TIPS = {
  round: '腮红斜向斜扫太阳穴，纵向显瘦',
  square: '苹果肌中心打圈晕染，柔化棱角',
  oval: '苹果肌斜向扫，自然提气色',
  heart: '苹果肌横向扫，平衡上下脸宽度',
  triangle: '苹果肌横扫 + 颧骨高光，平衡比例'
}
