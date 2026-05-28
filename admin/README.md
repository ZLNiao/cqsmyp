# GlamUp 管理后台

基于 Vue 3 + Vite + Element Plus 的独立管理后台。

## 功能

- 📊 仪表盘：用户/订单/营收/分析次数 + 近 7 天趋势图
- 👥 用户管理：搜索 + 手动赠送/取消 VIP
- 💎 订单管理：状态筛选 + 关键字搜索
- 🎨 分析记录：查看所有用户的分析历史
- ⭐ 明星人脸库：上传管理（百度 FaceSet）

## 默认账号

```
用户名：admin
密码：admin123
```

> ⚠️ 上线前**必须**修改！可以用 `node scripts/change-admin-pwd.js` 或直接更新 `admin_users` 表的 `password_hash`。

## 开发

```bash
# 1. 启动后端（确保 server/ 已 npm install 并跑起来）
cd ../server && npm run dev

# 2. 启动管理后台开发服务
cd ../admin
npm install
npm run dev
# 打开 http://localhost:5174
```

## 部署

### 方案 1：与主站合并部署（推荐）

```bash
npm run build
# dist/ 输出到 /opt/glamup/admin-dist
# 在 nginx 加一个 server 块，绑定 admin.your-domain.com → /opt/glamup/admin-dist
```

### 方案 2：放到主站子路径

```bash
# vite.config.js 加 base: '/admin/'
npm run build
# dist 输出后挪到 nginx html/admin/
```

### Nginx 子域名配置示例

```nginx
server {
    listen 443 ssl http2;
    server_name admin.your-domain.com;

    ssl_certificate /etc/nginx/ssl/admin.your-domain.com.pem;
    ssl_certificate_key /etc/nginx/ssl/admin.your-domain.com.key;

    # 限制 IP 白名单（可选，更安全）
    # allow 1.2.3.4;
    # deny all;

    root /opt/glamup/admin-dist;
    index index.html;

    location / { try_files $uri $uri/ /index.html; }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
