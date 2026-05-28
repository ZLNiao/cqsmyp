/**
 * 平台检测工具
 */

/** 当前是否运行在 iOS App 上 */
export function isIOSApp() {
  // #ifdef APP-PLUS
  try {
    return uni.getSystemInfoSync().platform === 'ios'
  } catch {
    return false
  }
  // #endif
  // #ifndef APP-PLUS
  return false
  // #endif
}

/** 当前是否运行在 Android App 上 */
export function isAndroidApp() {
  // #ifdef APP-PLUS
  try {
    return uni.getSystemInfoSync().platform === 'android'
  } catch {
    return false
  }
  // #endif
  // #ifndef APP-PLUS
  return false
  // #endif
}

/** 是否运行在 H5（浏览器） */
export function isH5() {
  // #ifdef H5
  return true
  // #endif
  // #ifndef H5
  return false
  // #endif
}

/**
 * 当前应该用哪种支付方式
 * - iOS：必须用 Apple IAP（苹果审核 3.1.1 强制）
 * - 其他：微信支付
 */
export function preferredPayMethod() {
  if (isIOSApp()) return 'appleiap'
  return 'wxpay'
}

/** 套餐 key → Apple IAP 产品 ID（必须与后端 PRODUCT_ID_MAP 一致） */
export const APPLE_PRODUCT_IDS = {
  month: 'com.zlniao.glamup.subscription.month',
  quarter: 'com.zlniao.glamup.subscription.quarter',
  year: 'com.zlniao.glamup.subscription.year'
}
