/**
 * AI 换妆服务
 *
 * 支持的 provider（按推荐顺序）：
 *  1. meitu       - 美图秀秀 AI 美颜接口（国内最佳效果）
 *  2. tongyi      - 阿里云通义万相（图生图，可作 demo 用）
 *  3. mock        - 开发期占位（返回原图 + 说明）
 *
 * 通过环境变量 AI_MAKEUP_PROVIDER 切换。
 *
 * 输入：原图 buffer + 风格 style
 * 输出：生成后的图片 URL（OSS）+ 生成耗时
 */
import axios from 'axios'
import crypto from 'node:crypto'
import logger from '../utils/logger.js'

/** 4 种妆容风格 */
export const MAKEUP_STYLES = {
  daily: {
    name: '日常通勤妆',
    emoji: '☀️',
    desc: '自然清透、显气色',
    prompt: '自然妆容，轻薄底妆，自然眉，大地色眼影，豆沙色唇釉，珊瑚色腮红'
  },
  date: {
    name: '约会甜心妆',
    emoji: '💗',
    desc: '元气可爱、桃花气',
    prompt: '甜美妆容，水光底妆，桃花眼妆，闪片眼影，珊瑚橙唇釉，蜜桃色腮红'
  },
  retro: {
    name: '复古港风妆',
    emoji: '🌹',
    desc: '高级浓郁、电影感',
    prompt: '复古妆容，雾面底妆，深邃眼线，烟熏眼影，正红色唇膏，斜飞腮红'
  },
  cool: {
    name: '清冷御姐妆',
    emoji: '❄️',
    desc: '冷调高级、气场全开',
    prompt: '冷调妆容，哑光底妆，冷棕烟熏，挑眉，正红雾面唇釉，骨相修容'
  }
}

export function getStyle(key) {
  return MAKEUP_STYLES[key] || MAKEUP_STYLES.daily
}

/**
 * 主入口：根据配置选择 provider 生成 AI 换妆图
 */
export async function generateAiMakeup({ imageBuffer, imageUrl, style }) {
  const styleConfig = getStyle(style)
  const provider = process.env.AI_MAKEUP_PROVIDER || 'mock'

  const t0 = Date.now()
  logger.info(`[ai-makeup] provider=${provider} style=${style}`)

  let resultUrl
  if (provider === 'meitu') {
    resultUrl = await generateByMeitu({ imageBuffer, imageUrl, styleConfig })
  } else if (provider === 'tongyi') {
    resultUrl = await generateByTongyi({ imageBuffer, imageUrl, styleConfig })
  } else {
    resultUrl = await generateByMock({ imageUrl, styleConfig })
  }

  return {
    resultUrl,
    style: styleConfig,
    provider,
    elapsedMs: Date.now() - t0
  }
}

// =============================================================
// Provider 1: 美图秀秀 AI（最佳效果）
// =============================================================
//
// 申请：https://ai.meitu.com/
// 接口文档：https://ai.meitu.com/doc
// 一般给企业开通后会发 API Key + Secret
//
// 注意：此处为模板代码，具体接口字段需按美图实际文档调整
async function generateByMeitu({ imageBuffer, imageUrl, styleConfig }) {
  if (!process.env.MEITU_API_KEY) {
    throw new Error('MEITU_API_KEY 未配置')
  }

  // 美图通常要求图片是 URL（先上传 OSS）或 base64
  const imageBase64 = imageBuffer.toString('base64')

  const { data } = await axios.post(
    'https://api.meitu.com/v1/effect/makeup',
    {
      image: imageBase64,
      makeup_type: mapStyleToMeitu(styleConfig),
      strength: 80 // 妆容强度 0~100
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.MEITU_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60s（AI 生成慢）
    }
  )

  if (data.code !== 0) {
    throw new Error(`美图 AI 失败：${data.message}`)
  }

  return data.data.result_url
}

function mapStyleToMeitu(styleConfig) {
  // 映射到美图的妆容 ID（实际值以美图文档为准）
  const map = {
    '日常通勤妆': 'daily_natural',
    '约会甜心妆': 'sweet_date',
    '复古港风妆': 'retro_hk',
    '清冷御姐妆': 'cool_lady'
  }
  return map[styleConfig.name] || 'daily_natural'
}

// =============================================================
// Provider 2: 阿里云通义万相（图生图，作为 demo）
// =============================================================
//
// 申请：https://dashscope.console.aliyun.com/
// 模型：wanx-style-repaint-v1（人物风格化）或 wanx-v1（通用图生图）
// 文档：https://help.aliyun.com/document_detail/2628085.html
async function generateByTongyi({ imageBuffer, imageUrl, styleConfig }) {
  if (!process.env.DASHSCOPE_API_KEY) {
    throw new Error('DASHSCOPE_API_KEY 未配置')
  }

  // 通义万相需要图片 URL（不支持 base64 直传），所以先上传 OSS 或临时存储
  if (!imageUrl) {
    throw new Error('通义万相需要先上传图片到 OSS 拿到 URL')
  }

  // 1. 提交异步任务
  const { data: submit } = await axios.post(
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis/',
    {
      model: 'wanx-v1',
      input: {
        prompt: `专业彩妆师为这张人脸照片化上${styleConfig.prompt}，保持原人脸特征不变，画面风格写实自然`,
        ref_img: imageUrl,
        ref_strength: 0.65, // 参考图强度
        ref_mode: 'repaint'  // 重绘模式
      },
      parameters: {
        n: 1,
        size: '1024*1024',
        seed: Math.floor(Math.random() * 100000)
      }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable'
      },
      timeout: 30000
    }
  )

  if (submit.code) throw new Error(`通义万相提交失败：${submit.message}`)
  const taskId = submit.output.task_id

  // 2. 轮询结果（通义异步返回，需要轮询）
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    const { data: status } = await axios.get(
      `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
      {
        headers: { Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}` },
        timeout: 10000
      }
    )

    const taskStatus = status.output?.task_status
    if (taskStatus === 'SUCCEEDED') {
      return status.output.results?.[0]?.url
    }
    if (taskStatus === 'FAILED') {
      throw new Error(`通义万相生成失败：${status.output?.message || 'unknown'}`)
    }
  }

  throw new Error('通义万相生成超时')
}

// =============================================================
// Provider 3: Mock（开发期占位）
// =============================================================
//
// 直接返回原图 URL + 模拟 3 秒处理时间
// 用于本地开发不需要真实 API 时
async function generateByMock({ imageUrl, styleConfig }) {
  await new Promise((r) => setTimeout(r, 3000))
  // 真实环境此处应该返回上传到 OSS 的 URL
  // mock 模式直接返回原图，前端会显示 "AI 模拟生成"
  return imageUrl || `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#8B5CF6"/>
          <stop offset="1" stop-color="#EC4899"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#g)"/>
      <text x="50%" y="45%" text-anchor="middle" fill="#fff" font-size="32" font-weight="700">
        AI 妆容效果
      </text>
      <text x="50%" y="55%" text-anchor="middle" fill="#fff" font-size="24" opacity="0.9">
        ${styleConfig.emoji} ${styleConfig.name}
      </text>
      <text x="50%" y="68%" text-anchor="middle" fill="#fff" font-size="14" opacity="0.7">
        Mock 模式 · 配置真实 AI 后将生成实际效果
      </text>
    </svg>`
  ).toString('base64')}`
}
