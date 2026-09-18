#!/bin/bash

# vox-reader 生产启动脚本
# 用于腾讯云服务器或其他生产环境

set -e  # 任何错误都退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印函数
print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# 检查环境
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}vox-reader 启动脚本${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js 未安装，请先安装 Node.js v18+"
    exit 1
fi

NODE_VERSION=$(node -v)
print_status "检测到 Node.js: $NODE_VERSION"

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    print_warning "pnpm 未安装，尝试使用 npm install -g pnpm"
    npm install -g pnpm
fi

PNPM_VERSION=$(pnpm -v)
print_status "检测到 pnpm: $PNPM_VERSION"

# 检查 .env.local 文件
if [ ! -f ".env.local" ]; then
    print_warning ".env.local 文件不存在"
    print_warning "请创建 .env.local 文件并配置腾讯云凭证"
    print_warning "参考: cp .env.local.example .env.local"
    exit 1
fi

# 检查必需的环境变量
if grep -q "TENCENT_CLOUD_SECRET_ID=" .env.local; then
    print_status "环境变量配置检查通过"
else
    print_error "TENCENT_CLOUD_SECRET_ID 未配置"
    exit 1
fi

# 安装依赖
print_status "安装依赖..."
pnpm install --no-frozen-lockfile

# 构建前端
print_status "构建前端应用..."
npm run build

# 检查构建结果
if [ ! -d "dist" ]; then
    print_error "前端构建失败"
    exit 1
fi

print_status "前端构建成功"

# 启动选项
MODE=${1:-"backend"}

case $MODE in
    "backend")
        print_status "启动后端服务 (端口 3000)..."
        node server/index.mjs
        ;;
    "frontend")
        print_status "启动前端服务 (端口 5173)..."
        npx vite preview --host
        ;;
    "all")
        print_status "同时启动前端和后端..."
        npx concurrently "node server/index.mjs" "npm run dev"
        ;;
    "test")
        print_status "测试 API 连接..."
        sleep 2  # 等待服务启动
        if curl -s http://localhost:3000/api/health | grep -q "ok"; then
            print_status "✅ 后端服务运行正常"
        else
            print_error "❌ 后端服务连接失败"
            exit 1
        fi
        ;;
    *)
        echo "用法: $0 [backend|frontend|all|test]"
        echo "  backend   - 只启动后端服务"
        echo "  frontend  - 只启动前端服务"
        echo "  all       - 启动前端和后端"
        echo "  test      - 测试 API 连接"
        exit 1
        ;;
esac
