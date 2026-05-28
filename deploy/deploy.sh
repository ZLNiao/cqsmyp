#!/usr/bin/env bash
# GlamUp 一键部署脚本（在阿里云/腾讯云 ECS 上执行）
set -euo pipefail

cd "$(dirname "$0")"

echo "==> 检查 .env 文件"
if [ ! -f ../server/.env ]; then
    echo "❌ 请先复制 ../server/.env.example 到 ../server/.env 并填入真实配置"
    exit 1
fi

echo "==> 拉取最新代码"
git pull

echo "==> 构建并启动容器"
docker compose down
docker compose build --no-cache
docker compose up -d

echo "==> 等待服务就绪"
sleep 10

echo "==> 健康检查"
docker compose ps
curl -sf http://localhost:3000/health || (echo "❌ API 启动失败"; exit 1)

echo "✅ 部署完成"
echo "   API:   https://api.your-domain.com"
echo "   H5:    https://www.your-domain.com"
