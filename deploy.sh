#!/bin/bash

# 部署脚本
set -e

echo "🚀 开始部署 RingBot 到服务器..."

# 配置变量
APP_NAME="ringbot"
APP_DIR="/var/www/ringbot"
BACKUP_DIR="/var/backups/ringbot"
NGINX_CONF="/etc/nginx/sites-available/ringbot"
USER="www-data"

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用 sudo 运行此脚本"
    exit 1
fi

# 创建备份
echo "📦 创建备份..."
if [ -d "$APP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    cp -r "$APP_DIR" "$BACKUP_DIR/ringbot-$(date +%Y%m%d-%H%M%S)"
fi

# 创建应用目录
echo "📁 创建应用目录..."
mkdir -p "$APP_DIR"
mkdir -p "$APP_DIR/logs"

# 复制文件到服务器
echo "📤 复制应用文件..."
# 注意：在实际部署时，这里应该从 Git 仓库拉取或从构建产物复制
# cp -r /path/to/your-built-app/* "$APP_DIR/"

# 设置权限
echo "🔒 设置文件权限..."
chown -R "$USER:$USER" "$APP_DIR"
chmod -R 755 "$APP_DIR"
chmod -R 755 "$APP_DIR/logs"

# 安装依赖（如果 node_modules 不在构建产物中）
if [ ! -d "$APP_DIR/node_modules" ]; then
    echo "📦 安装依赖..."
    cd "$APP_DIR"
    sudo -u "$USER" npm ci --only=production
fi

# 重启应用
echo "🔄 重启应用..."
if pm2 list | grep -q "$APP_NAME"; then
    pm2 restart "$APP_NAME"
else
    cd "$APP_DIR"
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
echo "🌐 Nginx 状态："
systemctl status nginx --no-pager -l