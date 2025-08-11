#!/bin/bash

# 服务器端部署脚本
set -e

echo "🚀 开始部署 RingBot..."

APP_DIR="/var/www/ringbot"
BACKUP_DIR="/var/backups/ringbot"

# 进入应用目录
cd "$APP_DIR"

# 创建备份
echo "📦 创建备份..."
sudo mkdir -p "$BACKUP_DIR"
if [ -d "build" ]; then
    sudo cp -r build "$BACKUP_DIR/build-$(date +%Y%m%d-%H%M%S)"
fi

# 拉取最新代码
echo "📥 拉取最新代码..."
sudo -u www-data git fetch origin main
sudo -u www-data git reset --hard origin/main

# 安装依赖
echo "📦 安装依赖..."
sudo -u www-data pnpm install --frozen-lockfile

# 构建应用
echo "🔨 构建应用..."
sudo -u www-data npm run build

# 重启应用
echo "🔄 重启应用..."
if pm2 list | grep -q "ringbot"; then
    pm2 restart ringbot
else
    pm2 start ecosystem.config.js --env production
fi

# 保存 PM2 配置
pm2 save

# 重载 Nginx
echo "🌐 重载 Nginx..."
nginx -t && systemctl reload nginx

echo "✅ 部署完成！"
echo "📊 应用状态："
pm2 status

echo ""
echo "🌐 访问地址："
echo "http://$(curl -s ifconfig.me)"
echo "http://$(curl -s ifconfig.me)/health"