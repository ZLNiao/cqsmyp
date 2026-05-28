# GlamUp 部署指南

## 服务器要求

- 阿里云 / 腾讯云 ECS：2 核 4G + 50G SSD（约 ¥800/年）
- 操作系统：Ubuntu 22.04 LTS
- 公网带宽：3M（或弹性公网 IP）
- 中国大陆服务器**必须 ICP 备案**（20 个工作日）

## 域名 + ICP 备案（必做）

1. 阿里云 / 腾讯云购买域名（约 ¥55/年）
2. 备案系统：上传身份证 + 营业执照 + 域名 → 等待管局审核（10~20 个工作日）
3. 备案通过后才能解析到大陆服务器

## 一次性环境准备

```bash
# 1. SSH 到服务器
ssh root@your-server-ip

# 2. 安装 Docker
curl -fsSL https://get.docker.com | bash
systemctl enable docker --now

# 3. 拉取项目
git clone https://github.com/ZLNiao/cqsmyp.git
cd cqsmyp/server

# 4. 配置环境变量
cp .env.example .env
vim .env   # 填入真实的密钥

# 5. 申请 SSL 证书（免费，腾讯云/阿里云控制台一键申请）
mkdir -p ../deploy/ssl
# 把下载的 .pem + .key 放到 deploy/ssl/

# 6. 启动
cd ../deploy
chmod +x deploy.sh
./deploy.sh
```

## 后续更新

```bash
cd cqsmyp/deploy
./deploy.sh   # 自动 git pull + 重新构建 + 重启
```

## 监控

```bash
docker compose logs -f api      # 查看 API 日志
docker compose logs -f nginx    # 查看 Nginx 日志
docker stats                    # 资源占用
```
