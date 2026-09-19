#!/bin/bash

# vox-reader 环境修复脚本
# 处理本地和线上环境的 API 问题

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_ok() {
    echo -e "${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

# 检查环境
print_header "修复步骤 1: 本地环境检查和修复"

# 1. 杀死所有现有的 Node 进程
echo "正在清理旧的进程..."
pkill -f "node server" || true
pkill -f "vite" || true
sleep 2

# 2. 检查 .env.local 文件
if [ ! -f ".env.local" ]; then
    print_error ".env.local 文件不存在"
    cp .env.local.example .env.local
    print_ok "已创建 .env.local，请编辑并填写腾讯云凭证"
    exit 1
fi

# 3. 验证环境变量
echo "检查环境变量..."
if grep -q "TENCENT_CLOUD_SECRET_ID=" .env.local; then
    SECRET_ID=$(grep "TENCENT_CLOUD_SECRET_ID=" .env.local | cut -d'=' -f2 | tr -d ' ')
    if [ -z "$SECRET_ID" ] || [ "$SECRET_ID" = "AKID1234567890ABCDEF" ]; then
        print_error "TENCENT_CLOUD_SECRET_ID 未正确配置"
        print_warning "请在 .env.local 中填写真实的腾讯云凭证"
        exit 1
    fi
    print_ok "腾讯云凭证已配置"
else
    print_error "TENCENT_CLOUD_SECRET_ID 未找到"
    exit 1
fi

# 4. 启动后端服务
print_header "修复步骤 2: 启动本地后端服务"
echo "启动后端服务 (端口 3000)..."
node server/index.mjs > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
print_ok "后端服务启动 (PID: $BACKEND_PID)"

sleep 3

# 5. 测试后端 API
echo "测试 API 连接..."
if curl -s http://localhost:3000/api/health | grep -q "ok"; then
    print_ok "后端 API 响应正常"
else
    print_error "后端 API 无响应"
    print_warning "查看日志: tail -f /tmp/backend.log"
    exit 1
fi

# 6. 测试翻译功能
echo "测试翻译功能..."
TRANSLATE_RESULT=$(curl -s -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"hello","sourceLanguage":"auto","targetLanguage":"zh"}')

if echo "$TRANSLATE_RESULT" | grep -q "translatedText"; then
    print_ok "翻译功能正常"
    RESULT=$(echo "$TRANSLATE_RESULT" | grep -o '"translatedText":"[^"]*"')
    echo "  $RESULT"
else
    print_error "翻译功能异常"
    echo "  响应: $TRANSLATE_RESULT"
fi

# 7. 启动前端
print_header "修复步骤 3: 启动本地前端开发服务器"
echo "启动前端 (端口 5173)..."
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
print_ok "前端服务启动 (PID: $FRONTEND_PID)"

sleep 3

# 8. 显示线上部署说明
print_header "修复步骤 4: 线上环境（腾讯云 EdgeOne）"

echo -e "${YELLOW}当前前端返回 HTML 错误（Status 200）的原因：${NC}"
echo "1. 云函数后端未部署"
echo "2. EdgeOne 路由规则未配置"
echo ""

echo -e "${YELLOW}快速部署云函数后端：${NC}"
echo ""
echo "步骤 A: 安装 Serverless 工具"
echo "  npm install -g serverless"
echo ""
echo "步骤 B: 配置腾讯云凭证"
echo "  serverless credentials set --provider tencent \\"
echo "    --id YOUR_SECRET_ID \\"
echo "    --key YOUR_SECRET_KEY"
echo ""
echo "步骤 C: 部署云函数后端"
echo "  serverless deploy"
echo ""
echo "步骤 D: 配置 EdgeOne 路由"
echo "  1. 登录腾讯云 EdgeOne 控制台"
echo "  2. 进入 '源站配置' 或 '回源规则'"
echo "  3. 添加规则："
echo "     - 路径: /api/*"
echo "     - 源站: [云函数的 API 网关地址]"
echo ""

echo -e "${YELLOW}或者直接运行一键部署脚本：${NC}"
echo "  ./deploy-serverless.sh"
echo ""

# 9. 显示访问地址
print_header "本地环境访问地址"
echo -e "${GREEN}前端应用：${NC} http://localhost:5173"
echo -e "${GREEN}后端 API：${NC} http://localhost:3000/api/health"
echo ""
echo -e "${GREEN}现在可以测试翻译功能了！${NC}"
echo ""
echo "查看日志:"
echo "  后端: tail -f /tmp/backend.log"
echo "  前端: tail -f /tmp/frontend.log"
