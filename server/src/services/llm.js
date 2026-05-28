/**
 * 大模型妆容生成（DeepSeek / 通义千问）
 */
import axios from 'axios'

export async function generateMakeup({ face, skin, userInfo }) {
  const prompt = `你是专业彩妆师。用户脸型：${face.shape.label}，肤色：${skin.tone.label}，年龄段：${userInfo?.age || '25-34'}，化妆频率：${userInfo?.makeupFreq || '偶尔'}。
请生成一套日常通勤妆容方案，按底妆/眼妆/唇妆/腮红 4 步输出，每步一句话，不超过 30 字。
直接输出 JSON：{ "title": "...", "steps": ["底妆：...", "眼妆：...", "唇妆：...", "腮红：..."] }`

  if (!process.env.DEEPSEEK_API_KEY) {
    return mockMakeup() // 没配 key 时返回 mock
  }

  const { data } = await axios.post('https://api.deepseek.com/chat/completions', {
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7
  }, {
    headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` }
  })

  try {
    return JSON.parse(data.choices[0].message.content)
  } catch {
    return mockMakeup()
  }
}

function mockMakeup() {
  return {
    title: '日常通勤妆',
    steps: [
      '底妆：轻薄粉底 + 局部遮瑕',
      '眼妆：大地色眼影 + 自然眼线',
      '唇妆：豆沙色唇釉',
      '腮红：珊瑚色斜向扫'
    ]
  }
}
