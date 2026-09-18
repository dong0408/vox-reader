#!/bin/bash

# vox-reader 线上环境诊断脚本
# 用于快速定位翻译功能问题

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

print_header "vox-reader 线上环境诊断"

# 1. 检查后端服务
print_header "检查 1: 后端服务状态"
if lsof -i :3000 &> /dev/null; then
    print_ok "后端服务运行中 (端口 3000)"
else
    print_error "后端服务未运行"
    print_warning "需要启动: node server/index.mjs"
fi

# 2. 检查 API 健康状态
print_header "检查 2: API 健康检查"
API_HEALTH=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/health)
HTTP_CODE=$(echo "$API_HEALTH" | tail -n1)
HTTP_BODY=$(echo "$API_HEALTH" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_ok "后端 API 响应正常 (HTTP $HTTP_CODE)"
    if echo "$HTTP_BODY" | grep -q "ok"; then
        print_ok "翻译服务已配置"
    fi
else
    print_error "后端 API 响应异常 (HTTP $HTTP_CODE)"
    print_warning "响应: $HTTP_BODY"
fi

# 3. 检查环境变量
print_header "检查 3: 环境变量配置"
if grep -q "TENCENT_CLOUD_SECRET_ID=" .env.local 2>/dev/null; then
    SECRET_ID=$(grep "TENCENT_CLOUD_SECRET_ID=" .env.local | cut -d'=' -f2)
    if [ -z "$SECRET_ID" ]; then
        print_error "TENCENT_CLOUD_SECRET_ID 为空"
    else
        print_ok "TENCENT_CLOUD_SECRET_ID 已配置"
    fi
else
    print_error ".env.local 中未找到 TENCENT_CLOUD_SECRET_ID"
fi

# 4. 检查前端构建
print_header "检查 4: 前端构建状态"
if [ -d "dist" ]; then
    print_ok "前端构建文件存在"
    FILE_COUNT=$(find dist -type f | wc -l)
    print_ok "包含 $FILE_COUNT 个文件"
else
    print_error "前端构建文件不存在"
    print_warning "需要执行: npm run build"
fi

# 5. 检查 Nginx 配置
print_header "检查 5: Nginx 配置"
if command -v nginx &> /dev/null; then
    print_ok "Nginx 已安装"

    # 检查 Nginx 是否运行
    if pgrep nginx &> /dev/null; then
        print_ok "Nginx 正在运行"

        # 测试 Nginx 配置
        if nginx -t &> /dev/null; then
            print_ok "Nginx 配置有效"
        else
            print_error "Nginx 配置有问题"
            nginx -t
        fi
    else
        print_warning "Nginx 未运行"
    fi
else
    print_warning "Nginx 未安装（可选）"
fi

# 6. 测试翻译 API
print_header "检查 6: 翻译 API 测试"

TEST_REQUEST=$(cat <<EOF
{
  "text": "Hello",
  "sourceLanguage": "auto",
  "targetLanguage": "zh"
}
EOF
)

API_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/translate \
  -H "Content-Type: application/json" \
  -d "$TEST_REQUEST")

API_CODE=$(echo "$API_RESPONSE" | tail -n1)
API_BODY=$(echo "$API_RESPONSE" | head -n-1)

if [ "$API_CODE" = "200" ]; then
    print_ok "翻译 API 响应正常 (HTTP $API_CODE)"
    if echo "$API_BODY" | grep -q "translatedText"; then
        print_ok "翻译成功！"
        echo "响应: $API_BODY"
    else
        print_warning "翻译返回异常响应"
        echo "响应: $API_BODY"
    fi
elif [ "$API_CODE" = "503" ]; then
    print_error "翻译服务未配置 (HTTP 503)"
    print_warning "需要在环境变量中配置腾讯云凭证"
else
    print_error "翻译 API 异常 (HTTP $API_CODE)"
    print_warning "响应: $API_BODY"
fi

# 7. 检查日志
print_header "检查 7: 最近错误日志"
if [ -f "/tmp/backend.log" ]; then
    print_ok "后端日志存在"
    print_warning "最后 5 行日志:"
    tail -5 /tmp/backend.log
else
    print_warning "未找到后端日志文件"
fi

# 8. 显示排查建议
print_header "排查建议"

echo -e "${YELLOW}如果翻译仍未工作，请按以下步骤检查：${NC}"
echo ""
echo "1. 确认后端服务运行："
echo "   lsof -i :3000"
echo ""
echo "2. 确认环境变量配置："
echo "   grep TENCENT_CLOUD .env.local"
echo ""
echo "3. 查看后端日志（实时）："
echo "   tail -f /tmp/backend.log"
echo ""
echo "4. 测试 API 连接："
echo "   curl http://localhost:3000/api/health"
echo ""
echo "5. 在浏览器中打开开发者工具 (F12)："
echo "   - 查看 Console 标签看是否有错误"
echo "   - 查看 Network 标签检查 API 请求"
echo "   - 检查请求 URL 是否正确"
echo ""
echo "6. 如果使用 Nginx："
echo "   - 确认 /api 请求被正确代理到后端"
echo "   - 检查 Nginx 配置中的 proxy_pass 设置"
echo "   - 参考: nginx.conf.example"
echo ""
echo -e "${YELLOW}常见问题：${NC}"
echo "- '<!DOCTYPE ...' 错误：表示返回的是 HTML，API 路由配置可能有问题"
echo "- 'Connection refused'：后端服务未运行"
echo "- 'CORS' 错误：浏览器安全问题，通常表示域名配置不对"
echo ""

print_header "诊断完成"
