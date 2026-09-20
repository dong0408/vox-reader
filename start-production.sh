#!/bin/bash

# vox-reader 生产启动脚本 v2（改进版）
# 支持前端静态文件 + 后端 API 的完整部署

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}vox-reader 生产环境启动脚本 (v2)${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js 未安装"
    exit 1
fi

print_status "Node.js $(node -v) 就绪"

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    print_warning "安装 pnpm..."
    npm install -g pnpm
fi

print_status "pnpm $(pnpm -v) 就绪"

# 检查 .env.local
if [ ! -f ".env.local" ]; then
    print_error ".env.local 不存在"
    exit 1
fi

print_status ".env.local 存在"

# 安装依赖
print_status "安装依赖..."
pnpm install --no-frozen-lockfile

# 构建前端（生产模式下使用相对路径 /api）
print_status "构建前端应用..."

# 临时修改 .env 以确保生产环境使用相对路径
if [ ! -f ".env" ]; then
    # 如果 .env 不存在，创建一个最小配置
    cat > .env << 'EOF'
# 生产环境不设置绝对 API URL，使用相对路径 /api
# 反向代理会将 /api 转发到后端
EOF
fi

npm run build

if [ ! -d "dist" ]; then
    print_error "前端构建失败"
    exit 1
fi

print_status "前端构建成功"
print_info "前端文件位置: $(pwd)/dist"

# 获取启动模式
MODE=${1:-"all"}

case $MODE in
    "backend-only")
        print_status "启动模式: 后端服务 (端口 3000)"
        print_info "你需要单独配置 Nginx 来提供前端静态文件"
        echo ""
        print_info "Nginx 配置示例请运行: ./start-production.sh show-nginx"
        echo ""
        node server/index.mjs
        ;;

    "frontend-only")
        print_status "启动模式: 前端静态服务 (端口 5173)"
        print_warning "前端无法访问后端 API（/api）"
        print_info "请确保后端在其他地方运行"
        npx vite preview --host 0.0.0.0 --port 5173
        ;;

    "all")
        print_status "启动模式: 前端 + 后端"
        print_info "前端: http://117.72.149.28:5173"
        print_info "后端 API: http://117.72.149.28:3000/api"
        print_info ""
        print_warning "⚠️  生产环境建议使用 Nginx 而不是这种方式"
        print_info "查看 Nginx 配置: ./start-production.sh show-nginx"
        echo ""
        npm install -g concurrently 2>/dev/null || true
        concurrently \
            --names "后端,前端" \
            --prefix "[{name}]" \
            --prefix-colors "blue,cyan" \
            "node server/index.mjs" \
            "npx vite preview --host 0.0.0.0 --port 5173"
        ;;

    "show-nginx")
        print_info "推荐的 Nginx 配置"
        cat << 'NGINX_CONFIG'

# 将此配置保存为 /etc/nginx/sites-available/vox-reader

upstream vox_backend {
    server localhost:3000;
    keepalive 32;
}

server {
    listen 5173;
    server_name 117.72.149.28;

    # 前端静态文件
    location / {
        root /var/www/vox_reader;  # dist 文件所在目录
        try_files $uri /index.html;  # SPA 配置

        # 缓存策略
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://vox_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # CORS 头（如果需要）
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    }
}

# 启用配置:
# sudo ln -s /etc/nginx/sites-available/vox-reader /etc/nginx/sites-enabled/
# sudo nginx -t
# sudo systemctl reload nginx

NGINX_CONFIG
        ;;

    *)
        echo "用法: $0 [backend-only|frontend-only|all|show-nginx]"
        echo ""
        echo "启动模式:"
        echo "  backend-only   - 只启动后端 (推荐配合 Nginx)"
        echo "  frontend-only  - 只启动前端静态服务"
        echo "  all            - 启动前端和后端 (仅用于开发/测试)"
        echo "  show-nginx     - 显示 Nginx 配置示例"
        exit 1
        ;;
esac
