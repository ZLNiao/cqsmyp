# Apple In-App Purchase 接入指南

## 为什么必须做？

**苹果审核条款 3.1.1**：iOS App 内的虚拟服务订阅必须通过 Apple IAP 收费，苹果抽成 30%（订阅 1 年后变 15%，小企业计划首年也是 15%）。

不接 → 上架审核必拒。

## 一、App Store Connect 配置（30~60 分钟）

### 1. 准备工作

需要：
- Apple Developer 账号（$99/年）
- 公司或个人开发者身份
- 已创建好 App 记录（Bundle ID 与 manifest.json 中一致）
- 已签署「付费应用协议」（[Agreements, Tax, and Banking](https://appstoreconnect.apple.com/agreements/) 中接受）

### 2. 创建订阅产品

[App Store Connect](https://appstoreconnect.apple.com/) → 你的 App → **App 内购买项目** → **创建**

为每个套餐创建一个**自动续订订阅**：

| 套餐 | 产品 ID（必须与代码完全一致） | 订阅时长 | 价格 |
|------|------------------------------|---------|------|
| 月度 | `com.zlniao.glamup.subscription.month` | 1 个月 | ¥30 档（CNY 4 / USD 4.99）|
| 季度 | `com.zlniao.glamup.subscription.quarter` | 3 个月 | ¥70 档 |
| 年度 | `com.zlniao.glamup.subscription.year` | 1 年 | ¥199 档 |

> ⚠️ Apple 价格只能选预设档位（无法自定义任意金额），找最接近的档位。

每个订阅需要：
- **订阅组**：把 3 个套餐放在同一个组（用户同一时间只能订阅组内一个套餐）
- **本地化信息**：中英文显示名 + 描述
- **审核截图**：1280x800 截图说明该订阅的功能
- **审核备注**：解释订阅价值

### 3. 生成 Shared Secret

App Store Connect → 你的 App → **App 信息** → **App 专用共享密钥** → 生成

复制下来，填到 `server/.env`：

```bash
APPLE_IAP_SHARED_SECRET=你的_32_位_shared_secret
```

### 4. 配置 Server Notifications（可选但推荐）

App Store Connect → 你的 App → **App 信息** → **App Store Server Notifications**：

- **生产服务器 URL**：`https://api.your-domain.com/api/order/iap/notification`
- **沙箱服务器 URL**：同上（或单独的测试 URL）
- **版本**：选 `Version 2`（StoreKit 2，新版）

### 5. 创建沙箱测试账号

App Store Connect → **用户和访问** → **沙箱测试员** → 创建

> ⚠️ 沙箱账号必须是**新邮箱**（不能与你的 Apple ID 相同），且不要在 iCloud 里登录。

## 二、HBuilderX 端配置

### 1. 启用 iAP 模块

`manifest.json`（已自动配置）：

```json
"app-plus": {
  "modules": {
    "iAP": {}
  }
}
```

### 2. 真机测试方法

```
1. 用 Xcode（或 HBuilderX 云打包）生成 ad-hoc 版 App，安装到真机
2. iPhone → 设置 → App Store → 滑到底部「沙箱账户」 → 登录沙箱账号
3. 打开 App，进入订阅页
4. 选套餐 → 点立即开通 → 弹出 Apple 支付（测试账号显示「沙箱账户」字样）
5. 输入沙箱账号密码确认 → 收到 receipt → 后端验证 → 开通会员
```

> 💡 沙箱订阅时长被压缩：1 月 → 5 分钟，1 年 → 1 小时。便于测试续订流程。

## 三、本地联调

```bash
# 后端 mock：未配 APPLE_IAP_SHARED_SECRET 时会报错
# 测试代码：
curl -X POST http://localhost:3000/api/order/iap/verify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "receiptData": "...真实 base64 收据...",
    "productId": "com.zlniao.glamup.subscription.month"
  }'
```

## 四、上架前检查清单

- [ ] 3 个订阅产品全部审核通过（状态 = "Ready to Submit"）
- [ ] 订阅组创建好，3 个套餐归属同一个组
- [ ] Shared Secret 已配到生产 .env
- [ ] Server Notifications V2 URL 配置（可选）
- [ ] iOS App 提交审核时**勾选** 3 个订阅产品（一并提交）
- [ ] App 描述里说明「自动续订订阅条款」（要求详见下方）
- [ ] 隐私政策链接可访问
- [ ] 帐号删除入口（Apple 5.1.1(v) 强制要求）

## 五、订阅条款必备内容（App 描述里必须写）

苹果审核要求 App 描述里**完整写出**：

```
✨ GlamUp 会员订阅说明

订阅周期与价格：
- 月度会员：¥XX/月，订阅期 1 个月
- 季度会员：¥XX/季，订阅期 3 个月
- 年度会员：¥XX/年，订阅期 12 个月

会员权益：
- 完整 AI 美颜分析报告
- AI 妆容方案生成
- 历史记录长期保存
- 去除广告

付款与续订：
- 通过 iTunes 账号扣款，订阅期到期前 24 小时内
  自动续订下一个周期，金额从 iTunes 账号扣除
- 在当前订阅期结束前 24 小时关闭自动续订即可取消
- 用户可在 设置 → Apple ID → 订阅 中查看和管理订阅

服务条款：https://your-domain.com/terms
隐私政策：https://your-domain.com/privacy
```

## 六、常见问题

### Q1: 沙箱测试报错 "Cannot connect to iTunes Store"
- 检查是否登录了沙箱账号
- 检查产品是否处于 Ready to Submit 状态
- 检查 Bundle ID 是否与 App Store Connect 一致

### Q2: 验证报错 21004（shared secret 不匹配）
- 检查 `.env` 中 `APPLE_IAP_SHARED_SECRET` 是否正确
- App 专用共享密钥与「主共享密钥」不同，建议用前者

### Q3: receipt 验证成功但找不到对应交易
- 检查 productId 是否完全一致（区分大小写）
- 检查 `latest_receipt_info` vs `receipt.in_app` 字段
- 同一个收据可能含多个产品，需要按 productId 过滤

### Q4: 订阅续订后用户 VIP 没自动延长
- 必须配置 App Store Server Notifications
- 在 `/iap/notification` 路由处理 `DID_RENEW` 事件
- 当前版本仅做基础占位，生产环境请用 `@apple/app-store-server-library` 完整实现

## 七、技术细节：StoreKit 1 vs 2

我们目前用的是 **StoreKit 1** 风格的 receipt 验证（`/verifyReceipt` 接口）：
- ✅ 更通用，老 iOS 也支持
- ❌ 苹果在逐步淘汰

**StoreKit 2**（推荐用于新项目）：
- 用 JWS 格式（JSON Web Signature）
- 验签更安全
- 客户端 API 更现代化（Swift only）
- 服务端用 `@apple/app-store-server-library` SDK

升级到 StoreKit 2 是 V2 的事情，当前 receipt 验证已足够上线。

## 八、参考链接

- [自动续订订阅工作原理](https://developer.apple.com/cn/documentation/storekit/in-app_purchase/original_api_for_in-app_purchase/subscriptions_and_offers/handling_subscriptions_billing)
- [审核指南 3.1.1](https://developer.apple.com/cn/app-store/review/guidelines/#in-app-purchase)
- [HBuilderX IAP 文档](https://uniapp.dcloud.net.cn/api/plugins/payment.html)
