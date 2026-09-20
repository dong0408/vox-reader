#!/bin/bash

# vox-reader 完整部署方案
# 前端在 /var/www/vox_reader (dist)
# 后端在 /home/vox_reader (完整项目)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}vox-reader 最终部署配置${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 配置
FRONTEND_DIR="/var/www/vox_reader"
BACKEND_DIR="/home/vox_reader"
BACKEND_PORT=3000

print_info "部署结构:"
echo "   前端: $FRONTEND_DIR (dist 文件，通过 IP 访问)"
echo "   后端: $BACKEND_DIR (完整项目，API 服务)"
echo ""

# 检查目录
if [ ! -d "$FRONTEND_DIR" ]; then
    print_error "前端目录不存在: $FRONTEND_DIR"
    exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
    print_error "后端目录不存在: $BACKEND_DIR"
    exit 1
fi

print_status "目录验证通过"
echo ""

# 检查后端服务文件
if [ ! -f "$BACKEND_DIR/server/index.mjs" ]; then
    print_error "找不到后端服务: $BACKEND_DIR/server/index.mjs"
    exit 1
fi

if [ ! -f "$BACKEND_DIR/.env.local" ]; then
    print_error "找不到环境配置: $BACKEND_DIR/.env.local"
    exit 1
fi

print_status "后端文件验证通过"
echo ""

# === 配置 Nginx ===
echo -e "${YELLOW}[1/3] 配置 Nginx${NC}"

# 创建 Nginx 配置
sudo bash << NGINX_SETUP
cat > /etc/nginx/sites-available/vox-reader << 'NGINX_CONFIG'
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
        try_files \$uri /index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://vox_backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINX_CONFIG

# 启用配置
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-enabled/vox-reader
ln -s /etc/nginx/sites-available/vox-reader /etc/nginx/sites-enabled/vox-reader

# 验证配置
nginx -t

# 重启
systemctl restart nginx
NGINX_SETUP

if [ $? -eq 0 ]; then
    print_status "Nginx 配置完成"
else
    print_error "Nginx 配置失败"
    exit 1
fi
echo ""

# === 检查后端状态 ===
echo -e "${YELLOW}[2/3] 后端服务状态${NC}"

if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_status "后端服务已在运行（端口 $BACKEND_PORT）"
else
    print_info "后端服务未运行"
    print_info ""
    print_info "请在另一个终端运行:"
    echo "    cd $BACKEND_DIR"
    echo "    node server/index.mjs"
    echo ""
    print_info "或后台运行:"
    echo "    cd $BACKEND_DIR"
    echo "    nohup node server/index.mjs > backend.log 2>&1 &"
fi
echo ""

# === 验证配置 ===
echo -e "${YELLOW}[3/3] 验证配置${NC}"

print_info "检查前端文件..."
if [ -f "$FRONTEND_DIR/index.html" ]; then
    print_status "前端 index.html 存在"
else
    print_error "前端 index.html 不存在"
fi

print_info "检查后端环境变量..."
if grep -q "TENCENT_CLOUD_SECRET_ID=" $BACKEND_DIR/.env.local; then
    print_status "腾讯云凭证已配置"
else
    print_error "腾讯云凭证未配置"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ 配置完成${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
print_info "现在的架构:"
echo "   用户 → http://你的IP (端口 80)"
echo "        ↓ (Nginx)"
echo "   ├─ 静态文件 → /var/www/vox_reader"
echo "   └─ /api/* → 代理到 localhost:3000"
echo ""
print_info "后端启动方式:"
echo "   cd $BACKEND_DIR"
echo "   node server/index.mjs"
echo ""
print_info "测试命令:"
echo "   curl http://127.0.0.1/api/health"
echo ""
