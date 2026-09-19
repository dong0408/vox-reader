#!/bin/bash

# vox-reader 快速部署到云服务器脚本
# 适用于：腾讯云 CVM、阿里云 ECS、华为云 ECS 等 Ubuntu 服务器
# 执行时间：约 10-15 分钟

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
}

print_step() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# 确认信息
print_header "vox-reader 云服务器部署"
echo ""
echo "此脚本将："
echo "  1. 安装 Node.js、Nginx"
echo "  2. 部署你的项目"
echo "  3. 配置 Nginx 反向代理"
echo "  4. 启动后端服务"
echo ""
read -p "继续吗? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# 步骤 1：更新系统
print_header "步骤 1：更新系统"
sudo apt-get update
print_step "系统已更新"

# 步骤 2：安装 Node.js
print_header "步骤 2：安装 Node.js"
if command -v node &> /dev/null; then
    print_step "Node.js 已安装：$(node -v)"
else
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_step "Node.js 已安装：$(node -v)"
fi

# 步骤 3：安装 Nginx
print_header "步骤 3：安装 Nginx"
if command -v nginx &> /dev/null; then
    print_step "Nginx 已安装"
else
    sudo apt-get install -y nginx
    print_step "Nginx 已安装"
fi

# 步骤 4：获取项目
print_header "步骤 4：获取项目"
read -p "请输入你的 GitHub 项目地址 (https://...): " GITHUB_URL
cd /tmp
git clone "$GITHUB_URL" vox-reader-deploy
cd vox-reader-deploy
print_step "项目已克隆"

# 步骤 5：安装依赖和构建
print_header "步骤 5：安装依赖和构建前端"
npm install
npm run build
print_step "依赖已安装，前端已构建"

# 步骤 6：配置 Nginx
print_header "步骤 6：配置 Nginx"
read -p "请输入你的域名（例如：example.com）: " DOMAIN
read -p "请输入你的邮箱（用于 SSL 证书）: " EMAIL

# 创建 Nginx 配置
sudo tee /etc/nginx/sites-available/vox-reader > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # 重定向到 HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # 自签名证书（稍后用 Let's Encrypt 替换）
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # 前端静态文件
    location / {
        root /var/www/vox-reader/dist;
        try_files \$uri \$uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, max-age=86400";
    }

    # 后端 API
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 启用配置
sudo ln -sf /etc/nginx/sites-available/vox-reader /etc/nginx/sites-enabled/
sudo nginx -t
print_step "Nginx 配置已完成"

# 步骤 7：复制文件到生产目录
print_header "步骤 7：部署文件"
sudo mkdir -p /var/www/vox-reader
sudo cp -r dist /var/www/vox-reader/
sudo cp -r server /var/www/vox-reader/
sudo cp package.json package-lock.json .env.local /var/www/vox-reader/ 2>/dev/null || true
sudo chown -R www-data:www-data /var/www/vox-reader
print_step "文件已部署"

# 步骤 8：生成自签名证书（临时）
print_header "步骤 8：生成 SSL 证书"
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/key.pem \
    -out /etc/nginx/ssl/cert.pem \
    -subj "/CN=$DOMAIN"
print_step "临时 SSL 证书已生成"

# 步骤 9：启动 Nginx
print_header "步骤 9：启动服务"
sudo systemctl start nginx
sudo systemctl enable nginx
print_step "Nginx 已启动并设置开机启动"

# 步骤 10：启动后端服务
cd /var/www/vox-reader
sudo npm install
nohup node server/index.mjs > /var/log/vox-reader-backend.log 2>&1 &
print_step "后端服务已启动"

# 完成
print_header "部署完成！"
echo ""
echo -e "${GREEN}✓ 应用已部署${NC}"
echo ""
echo "访问地址："
echo "  http://$DOMAIN (会重定向到 HTTPS)"
echo "  https://$DOMAIN"
echo ""
echo "后端日志："
echo "  tail -f /var/log/vox-reader-backend.log"
echo ""
echo "下一步（重要）："
echo "  1. 安装真实 SSL 证书（Let's Encrypt）："
echo "     sudo apt-get install certbot python3-certbot-nginx"
echo "     sudo certbot certonly --nginx -d $DOMAIN"
echo "  2. 配置 DNS 将 $DOMAIN 指向服务器 IP"
echo "  3. 重启 Nginx："
echo "     sudo systemctl restart nginx"
echo ""
