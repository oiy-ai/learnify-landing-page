#!/bin/bash

# Ubuntu 22.04.5 LTS 服务器初始化脚本
set -e

echo "🖥️  初始化 Ubuntu 服务器环境..."

# 更新系统
echo "🔄 更新系统包..."
apt update && apt upgrade -y

# 安装基础工具
echo "🛠️  安装基础工具..."
apt install -y curl wget git unzip software-properties-common build-essential

# 安装 Node.js (使用 NodeSource 仓库)
echo "📦 安装 Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# 验证 Node.js 安装
echo "✅ Node.js 版本: $(node --version)"
echo "✅ NPM 版本: $(npm --version)"

# 安装 pnpm
echo "📦 安装 pnpm..."
npm install -g pnpm

# 安装 PM2
echo "📦 安装 PM2..."
npm install -g pm2

# 设置 PM2 开机自启
pm2 startup
echo "⚠️  请运行上面输出的命令来设置 PM2 开机自启"

# 安装 Nginx
echo "🌐 安装 Nginx..."
apt install -y nginx

# 启动并启用 Nginx
systemctl start nginx
systemctl enable nginx

# 配置防火墙
echo "🔥 配置防火墙..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# 安装 Certbot (Let's Encrypt)
echo "🔐 安装 Certbot..."
apt install -y certbot python3-certbot-nginx

# 创建应用用户
echo "👤 创建应用目录..."
mkdir -p /var/www/ringbot
mkdir -p /var/www/ringbot/logs
mkdir -p /var/backups/ringbot

# 设置权限
chown -R www-data:www-data /var/www/ringbot
chmod -R 755 /var/www/ringbot

# 创建基础的 Nginx 配置
echo "📝 创建基础 Nginx 配置..."
cat > /etc/nginx/sites-available/ringbot << 'EOF'
server {
    listen 80;
    server_name _;  # 临时配置，稍后替换为您的域名
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/ringbot /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试 Nginx 配置
nginx -t

# 重启 Nginx
systemctl restart nginx

# 显示状态
echo ""
echo "🎉 服务器初始化完成！"
echo ""
echo "📊 服务状态："
echo "- Node.js: $(node --version)"
echo "- NPM: $(npm --version)"
echo "- PM2: $(pm2 --version)"
echo "- Nginx: $(nginx -v 2>&1)"
echo ""
echo "🔗 下一步："
echo "1. 配置您的域名指向此服务器"
echo "2. 编辑 /etc/nginx/sites-available/ringbot 设置正确的域名"
echo "3. 运行 certbot --nginx 设置 SSL 证书"
echo "4. 部署您的应用"
echo ""
echo "🌐 当前服务器 IP: $(curl -s ifconfig.me)"