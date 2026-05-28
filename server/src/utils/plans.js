/** 套餐配置（金额单位：分） */
export const PLANS = {
  month: { days: 30, price: 2990, label: '月度会员' },
  quarter: { days: 90, price: 6990, label: '季度会员' },
  year: { days: 365, price: 19900, label: '年度会员' }
}

export function getPlan(key) {
  return PLANS[key] || null
}

/** 生成订单号：GU + 13 位时间戳 + 5 位随机数 */
export function generateOrderNo() {
  const ts = Date.now()
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `GU${ts}${rand}`
}
