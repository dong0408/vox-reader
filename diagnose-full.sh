#!/bin/bash

# 快速诊断脚本 - 诊断本地和线上环境问题

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

print_ok() {
    echo -e "${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_header "vox-reader API 诊断工具"

# ============== 本地环境诊断 ==============
print_header "本地环境诊断"

# 1. 检查后端是否运行
echo "1. 检查后端服务..."
if lsof -i :3000 &> /dev/null; then
    print_ok "后端服务运行中 (端口 3000)"
else
    print_error "后端服务未运行"
    echo "   启动方式: node server/index.mjs"
fi

# 2. 测试 API 健康检查
echo ""
echo "2. 测试 API 健康检查..."
HEALTH=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/health 2>/dev/null | tail -n1)
if [ "$HEALTH" = "200" ]; then
    print_ok "API 响应正常 (HTTP 200)"
else
    print_error "API 响应异常 (HTTP $HEALTH)"
fi

# 3. 测试翻译功能
echo ""
echo "3. 测试翻译功能..."
TRANSLATE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"test","sourceLanguage":"auto","targetLanguage":"zh"}' 2>/dev/null)

HTTP_CODE=$(echo "$TRANSLATE" | tail -n1)
HTTP_BODY=$(echo "$TRANSLATE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    if echo "$HTTP_BODY" | grep -q "translatedText"; then
        print_ok "翻译功能正常"
        echo "   样本: $(echo "$HTTP_BODY" | grep -o '"translatedText":"[^"]*"')"
    else
        print_error "翻译返回异常响应"
        echo "   响应: $HTTP_BODY"
    fi
else
    print_error "翻译 API 异常 (HTTP $HTTP_CODE)"
    echo "   响应: $HTTP_BODY"
fi

# 4. 检查前端
echo ""
echo "4. 检查前端开发服务..."
if lsof -i :5173 &> /dev/null || lsof -i :5174 &> /dev/null; then
    print_ok "前端服务运行中"
else
    print_warning "前端服务未运行"
    echo "   启动方式: npm run dev"
fi

# ============== 线上环境诊断 ==============
print_header "线上环境诊断（腾讯云 EdgeOne）"

APP_URL="https://vox-reader-dp6yr5iwyskv.edgeone.cool"

# 1. 检查前端是否可访问
echo "1. 检查前端应用..."
FRONTEND=$(curl -s -w "\n%{http_code}" "$APP_URL" 2>/dev/null | tail -n1)
if [ "$FRONTEND" = "200" ]; then
    print_ok "前端应用可访问"
else
    print_error "前端应用无法访问 (HTTP $FRONTEND)"
fi

# 2. 检查 API 端点
echo ""
echo "2. 检查 API 端点..."
API_URL="${APP_URL}/api/translate"
API_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{"text":"test","sourceLanguage":"auto","targetLanguage":"zh"}' 2>/dev/null)

API_CODE=$(echo "$API_RESPONSE" | tail -n1)
API_BODY=$(echo "$API_RESPONSE" | head -n-1)

if [ "$API_CODE" = "200" ]; then
    if echo "$API_BODY" | grep -q "translatedText"; then
        print_ok "API 正常工作"
    else
        print_error "API 返回 HTML（云函数未部署）"
        echo "   需要部署云函数后端"
        echo "   执行: ./deploy-serverless.sh"
    fi
elif [ "$API_CODE" = "500" ]; then
    print_error "API 返回 500 错误"
    echo "   可能原因："
    echo "   1. 云函数配置错误"
    echo "   2. 腾讯云凭证无效"
    echo "   3. 腾讯云账户无翻译服务"
else
    print_error "API 异常 (HTTP $API_CODE)"
fi

# ============== 问题诊断 ==============
print_header "问题诊断和建议"

echo ""
echo "本地环境问题排查："
echo "❌ 后端服务未运行"
echo "   → 执行: node server/index.mjs"
echo ""
echo "❌ API 返回错误"
echo "   → 检查 .env.local 配置"
echo "   → 查看日志: tail -f /tmp/backend.log"
echo ""
echo "❌ 翻译失败"
echo "   → 检查腾讯云凭证有效性"
echo "   → 确保账户开通了翻译服务"
echo ""

echo ""
echo "线上环境问题排查："
echo "❌ API 返回 HTML"
echo "   → 云函数未部署"
echo "   → 执行: ./deploy-serverless.sh"
echo ""
echo "❌ EdgeOne 路由配置错误"
echo "   → 登录腾讯云 EdgeOne 控制台"
echo "   → 检查源站配置"
echo "   → 确保 /api/* 指向云函数 API 网关"
echo ""

# ============== 快速修复 ==============
print_header "快速修复"

read -p "是否要自动修复本地环境? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    chmod +x fix-api.sh
    ./fix-api.sh
fi

read -p "是否要部署云函数到腾讯云? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    chmod +x deploy-serverless.sh
    ./deploy-serverless.sh
fi

print_header "诊断完成"
echo ""
echo "更多帮助请查看: EDGEONE_DEPLOYMENT.md"
