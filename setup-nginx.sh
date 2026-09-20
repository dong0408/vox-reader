#!/bin/bash

# 自动配置 Nginx 脚本 - 适用于腾讯云服务器
# 用法: sudo bash setup-nginx.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then
    print_error "请使用 sudo 运行此脚本"
    exit 1
fi

echo "=========================================="
echo "vox-reader Nginx 自动配置"
echo "=========================================="

# 检查 Nginx
if ! command -v nginx &> /dev/null; then
    print_warning "Nginx 未安装，正在安装..."
    apt-get update
    apt-get install -y nginx
fi

print_status "Nginx 已安装: $(nginx -v 2>&1)"

# 创建前端文件目录
if [ ! -d "/var/www/vox_reader" ]; then
    mkdir -p /var/www/vox_reader
    print_status "创建前端目录: /var/www/vox_reader"
fi

# 复制 dist 文件
if [ -d "./dist" ]; then
    cp -r dist/* /var/www/vox_reader/
    chown -R www-data:www-data /var/www/vox_reader
    print_status "前端文件已复制到 /var/www/vox_reader"
else
    print_error "找不到 dist 目录，请先运行 npm run build"
    exit 1
fi

# 创建 Nginx 配置
cat > /etc/nginx/sites-available/vox-reader << 'EOF'
upstream vox_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name _;
    client_max_body_size 50M;

    # 前端静态文件
    location / {
        root /var/www/vox_reader;
        index index.html;
        try_files $uri /index.html;

        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 后端 API 代理 - 关键配置
    location /api/ {
        proxy_pass http://vox_backend;
        proxy_http_version 1.1;

        # 重要: 传递原始请求信息
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 不缓存
        proxy_cache_bypass $http_upgrade;
    }

    # 健康检查
    location /api/health {
        proxy_pass http://vox_backend;
        access_log off;
    }
}
EOF

# 创建符号链接
if [ -L "/etc/nginx/sites-enabled/vox-reader" ]; then
    rm /etc/nginx/sites-enabled/vox-reader
fi

ln -s /etc/nginx/sites-available/vox-reader /etc/nginx/sites-enabled/vox-reader

# 禁用默认配置
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    rm /etc/nginx/sites-enabled/default
    print_status "禁用默认 Nginx 配置"
fi

# 测试 Nginx 配置
if nginx -t &>/dev/null; then
    print_status "Nginx 配置正确"
else
    print_error "Nginx 配置有错误"
    nginx -t
    exit 1
fi

# 重启 Nginx
systemctl restart nginx
print_status "Nginx 已重启"

# 启用开机自启
systemctl enable nginx
print_status "Nginx 开机自启已启用"

echo ""
echo "=========================================="
echo "✅ Nginx 配置完成"
echo "=========================================="
echo ""
echo "接下来:"
echo "1. 启动后端服务:"
echo "   cd /path/to/vox-reader"
echo "   ./start-production.sh backend-only"
echo ""
echo "2. 访问应用:"
echo "   http://117.72.149.28:5173"
echo ""
echo "3. 检查日志:"
echo "   tail -f /var/log/nginx/error.log"
echo "   tail -f /var/log/nginx/access.log"
echo ""
