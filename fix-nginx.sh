#!/bin/bash

# vox-reader 手动修复脚本
# 当自动脚本失败时使用

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}vox-reader 500 错误修复${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 第1步：检查目录
echo -e "${YELLOW}[1/4] 检查和创建目录${NC}"

FRONTEND_DIR="/var/www/vox_reader"

if [ ! -d "$FRONTEND_DIR" ]; then
    echo "创建前端目录: $FRONTEND_DIR"
    sudo mkdir -p $FRONTEND_DIR
    echo "✅ 目录已创建"
else
    echo "✅ 前端目录已存在"
fi
echo ""

# 第2步：配置 Nginx
echo -e "${YELLOW}[2/4] 创建 Nginx 配置${NC}"

sudo tee /etc/nginx/sites-available/vox-reader > /dev/null << 'EOF'
upstream vox_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    client_max_body_size 50M;

    # 前端静态文件
    location / {
        root /var/www/vox_reader;
        index index.html;
        try_files $uri /index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://vox_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

echo "✅ Nginx 配置已创建"
echo ""

# 第3步：启用配置
echo -e "${YELLOW}[3/4] 启用 Nginx 配置${NC}"

# 删除旧链接
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/vox-reader

# 创建新链接
sudo ln -s /etc/nginx/sites-available/vox-reader /etc/nginx/sites-enabled/vox-reader

echo "✅ Nginx 配置已启用"
echo ""

# 第4步：测试和重启
echo -e "${YELLOW}[4/4] 测试和启动 Nginx${NC}"

# 测试配置
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo "✅ Nginx 配置测试通过"
else
    echo "❌ Nginx 配置有错误，详情如下:"
    sudo nginx -t
    exit 1
fi

# 重启 Nginx
sudo systemctl restart nginx

if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx 已启动"
else
    echo "❌ Nginx 启动失败"
    exit 1
fi
echo ""

# 完成
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 修复完成${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "现在测试访问:"
echo "  curl http://127.0.0.1/"
echo ""
echo "如果前端目录为空，你需要上传 dist 文件:"
echo "  scp -r dist/* root@你的IP:/var/www/vox_reader/"
echo ""
