# 短信登录 + 微信支付 接入指南

## 一、阿里云短信（约 30 分钟开通）

### 1. 实名认证 + 充值
- 前往 [阿里云短信控制台](https://dysms.console.aliyun.com/)
- 完成企业/个人实名认证
- 充值（个人 ¥10 起，每条 ≈ ¥0.045）

### 2. 申请签名 + 模板（1~2 小时审核）

**国内消息 → 签名管理 → 添加签名：**
- 签名名称：`GlamUp`
- 签名用途：自用
- 适用场景：APP

**国内消息 → 模板管理 → 添加模板：**
- 模板类型：验证码
- 模板名称：登录验证
- 模板内容：`您的验证码是 ${code}，5 分钟内有效，请勿泄露。`
- 提交审核 → 拿到 TemplateCode（如 `SMS_465123456`）

### 3. 获取 AccessKey

[RAM 访问控制台](https://ram.console.aliyun.com/) → 用户 → 创建用户 → 勾选"OpenAPI 调用访问" → 添加权限 `AliyunDysmsFullAccess` → 拿 AK + Secret

### 4. 配置 .env

```bash
SMS_ACCESS_KEY=LTAI5tXXXXXXXX
SMS_SECRET=YourSecretKey
SMS_SIGN_NAME=GlamUp
SMS_TEMPLATE_CODE=SMS_465123456
```

> 💡 **未配置时降级为 Mock**：服务端会把验证码打印到日志（`[SMS Mock] phone=138... code=123456`），便于本地调试。

---

## 二、微信支付 V3（约 1 周完成）

### 1. 注册账号（顺序很重要！）

| 步骤 | 平台 | 时长 | 费用 |
|------|------|------|------|
| ① 注册微信开放平台账号 | [open.weixin.qq.com](https://open.weixin.qq.com/) | 当天 | ¥300（认证费）|
| ② 创建移动应用，拿 `AppID` | 同上 | 7 天审核 | - |
| ③ 注册微信支付商户号 | [pay.weixin.qq.com](https://pay.weixin.qq.com/) | 1~5 天 | 免费 |
| ④ 关联 AppID（商户平台 → 产品中心 → AppID 账户管理）| 同上 | 1 天 | - |
| ⑤ 开通「APP 支付」产品 | 同上 | 即时 | 0.6% 费率 |

### 2. 获取证书 + 密钥

**商户平台 → 账户中心 → API 安全：**

1. **API 证书** → 申请证书 → 下载得到 3 个文件：
   - `apiclient_cert.p12`（PFX 证书）
   - `apiclient_cert.pem`（公钥）
   - `apiclient_key.pem` ⭐ **后端用这个**
   - 还有一个 **证书序列号**（10 位左右），抄下来

2. **APIv3 密钥** → 设置 32 位密钥（自己定义，记好）

3. **平台证书**（用于验证微信回调）→ 用脚本拉取：
   ```bash
   # 简单方法：商户后台手动下载，或者首次启动时调用
   # GET https://api.mch.weixin.qq.com/v3/certificates 获取
   ```

### 3. 部署证书

把 `apiclient_key.pem` 放到服务器（不要进 git！），路径示例：

```bash
# 服务器上
mkdir -p /opt/glamup/certs
scp apiclient_key.pem root@server:/opt/glamup/certs/
chmod 400 /opt/glamup/certs/apiclient_key.pem
```

修改 `docker-compose.yml`，挂载证书目录：

```yaml
api:
  # ... 其他配置
  volumes:
    - /opt/glamup/certs:/app/certs:ro
```

### 4. 配置 .env

```bash
WECHAT_APPID=wxxxxxxxxxxxx
WECHAT_MCH_ID=1612345678
WECHAT_SERIAL_NO=4B3C9XXXXXXXXX
WECHAT_PRIVATE_KEY_PATH=/app/certs/apiclient_key.pem
WECHAT_API_V3_KEY=your-32-char-apiv3-key-aaaaaaaaaaa
WECHAT_PAY_NOTIFY_URL=https://api.your-domain.com/api/order/callback/wechat
```

### 5. 配置回调白名单

商户平台 → 产品中心 → 支付回调通知 → 设置 `https://api.your-domain.com/api/order/callback/wechat`

> ⚠️ 微信支付要求回调 URL **必须 HTTPS** 且 **不能带端口号**，所以你必须先把 nginx + SSL 配好。

> 💡 **未配置时降级为 Mock**：服务端会跳过真实下单，直接给用户开通会员，便于本地调试。生产环境务必配置完整。

---

## 三、本地联调流程

```bash
# 1. 启动 Redis + MySQL（用 docker-compose 单独起）
cd deploy
docker compose up -d redis mysql

# 2. 启动后端
cd ../server
cp .env.example .env  # 编辑填值（短信和支付可以先不填，会走 mock）
npm install
npm run dev

# 3. 测试短信发送
curl -X POST http://localhost:3000/api/user/sms \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000"}'
# 没配 SMS 时控制台会打印 [SMS Mock] phone=13800138000 code=123456

# 4. 测试登录
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","code":"123456"}'
# 返回 { token, user }

# 5. 测试创建订单（需带 token）
curl -X POST http://localhost:3000/api/order/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <上一步拿到的 token>" \
  -d '{"plan":"month"}'
# 没配微信支付时返回 { mock: true } 直接开通会员
```

---

## 四、常见问题

### Q1: 短信发送报错 `isv.BUSINESS_LIMIT_CONTROL`
- 原因：阿里云对未实名手机号有额度限制（每天每号 5 条）
- 解决：检查模板是否通过审核 / 检查签名是否正确

### Q2: 微信支付报错 `40004` 商户号不存在
- 原因：商户号没有关联当前 AppID
- 解决：商户平台 → 产品中心 → AppID 账户管理 → 关联

### Q3: 支付成功但 VIP 没开通
- 原因：回调没收到（生产环境检查微信能否访问你的 NotifyUrl）
- 排查：
  ```bash
  # 看 nginx 日志有没有微信请求
  docker compose logs nginx | grep callback
  # 看后端日志
  docker compose logs api | grep 微信回调
  ```

### Q4: iOS 提交审核被拒：3.1.1
- 原因：iOS 端不能用微信支付订阅虚拟服务（必须用 IAP）
- 解决：
  - **方案 A**：iOS 走 Apple IAP，Android 走微信支付（双轨）
  - **方案 B**：把订阅改造成「数字商品」之外的形态
- 详见 `RELEASE_CHECKLIST.md`
