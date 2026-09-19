#!/bin/bash

# EdgeOne API 诊断脚本
# 用于诊断 HTML 返回问题

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

# 用户输入
print_header "EdgeOne API 诊断工具"
echo ""
echo "请按照以下步骤获取所需信息："
echo ""
echo "1. 你的云函数 API 网关地址（从腾讯云控制台复制）"
echo "   位置: 云函数 SCF → vox-reader-translate → 触发器 → API网关"
echo ""
read -p "请输入你的云函数 API 网关地址（https://...）: " SCF_URL
echo ""

read -p "请输入你的 EdgeOne 应用地址（https://...）: " EDGEONE_URL

echo ""
print_header "开始诊断"

# 1. 测试云函数
echo ""
echo "1️⃣ 测试云函数 API..."
echo "URL: $SCF_URL"
echo ""

SCF_RESPONSE=$(curl -s -X POST "$SCF_URL" \
  -H "Content-Type: application/json" \
  -d '{"text":"hello","sourceLanguage":"auto","targetLanguage":"zh"}')

if echo "$SCF_RESPONSE" | grep -q "translatedText"; then
    print_ok "云函数工作正常！"
    echo "响应: $SCF_RESPONSE"
elif echo "$SCF_RESPONSE" | grep -q "<!DOCTYPE\|<html"; then
    print_error "云函数返回 HTML（未正确部署）"
    echo "响应: ${SCF_RESPONSE:0:200}..."
else
    print_warning "云函数返回异常"
    echo "响应: $SCF_RESPONSE"
fi

# 2. 测试 EdgeOne
echo ""
echo "2️⃣ 测试 EdgeOne API..."
EDGEONE_API="${EDGEONE_URL}/api/translate"
echo "URL: $EDGEONE_API"
echo ""

EDGEONE_RESPONSE=$(curl -s -X POST "$EDGEONE_API" \
  -H "Content-Type: application/json" \
  -d '{"text":"hello","sourceLanguage":"auto","targetLanguage":"zh"}')

if echo "$EDGEONE_RESPONSE" | grep -q "translatedText"; then
    print_ok "EdgeOne API 工作正常！"
    echo "响应: $EDGEONE_RESPONSE"
elif echo "$EDGEONE_RESPONSE" | grep -q "<!DOCTYPE\|<html"; then
    print_error "EdgeOne 返回 HTML"
    echo "这说明 EdgeOne 没有正确转发请求到云函数"
    echo "响应: ${EDGEONE_RESPONSE:0:200}..."
else
    print_warning "EdgeOne 返回异常"
    echo "响应: $EDGEONE_RESPONSE"
fi

# 3. 对比两个响应
echo ""
echo "3️⃣ 对比诊断..."

if echo "$SCF_RESPONSE" | grep -q "translatedText"; then
    if echo "$EDGEONE_RESPONSE" | grep -q "translatedText"; then
        print_ok "两个 API 都返回正常！"
        print_warning "问题可能在前端配置或浏览器缓存"
    elif echo "$EDGEONE_RESPONSE" | grep -q "<!DOCTYPE\|<html"; then
        print_error "问题已定位："
        echo "  • 云函数: ✅ 正常"
        echo "  • EdgeOne: ❌ 返回 HTML"
        echo ""
        echo "原因可能是："
        echo "  1. EdgeOne 源站规则配置错误"
        echo "  2. EdgeOne 缓存未清除"
        echo "  3. API 网关地址不正确"
    fi
else
    print_error "云函数本身有问题"
    echo "需要检查："
    echo "  1. 环境变量是否正确"
    echo "  2. 云函数代码是否完整"
    echo "  3. 查看云函数日志（云函数 → 日志查询）"
fi

# 4. 显示解决方案
print_header "解决方案"

if echo "$EDGEONE_RESPONSE" | grep -q "<!DOCTYPE\|<html"; then
    echo ""
    echo "由于 EdgeOne 返回 HTML，按以下步骤处理："
    echo ""
    echo "📝 步骤 1：清除 EdgeOne 缓存"
    echo "  • 登录腾讯云 EdgeOne 控制台"
    echo "  • 找到你的站点"
    echo "  • 进入 '缓存管理' 或 '清除缓存'"
    echo "  • 清除 /api/* 路径的缓存"
    echo ""
    echo "✅ 步骤 2：验证源站规则"
    echo "  • 进入 '源站配置' 或 '回源规则'"
    echo "  • 检查是否存在 /api/* 的规则"
    echo "  • 确认源站地址是 API 网关链接"
    echo "  • 例如: https://service-xxx.scf.tencentserverless.com/release/vox-reader-translate"
    echo ""
    echo "🔄 步骤 3：等待配置生效"
    echo "  • 配置生效需要 1-5 分钟"
    echo "  • 清除浏览器缓存（Ctrl+Shift+Delete）"
    echo "  • 重新打开应用并测试"
    echo ""
    echo "📋 步骤 4：检查 EdgeOne 日志"
    echo "  • 进入 '日志分析' 或 '实时日志'"
    echo "  • 搜索 /api/translate 的请求"
    echo "  • 查看是否被正确转发到源站"
elif echo "$SCF_RESPONSE" | grep -q "<!DOCTYPE\|<html"; then
    echo ""
    echo "云函数未正确部署，按以下步骤修复："
    echo ""
    echo "1️⃣ 重新部署云函数"
    echo "  • 检查函数代码是否完整"
    echo "  • 查看日志了解具体错误"
    echo ""
    echo "2️⃣ 查看云函数日志"
    echo "  • 在腾讯云控制台查看日志"
    echo "  • 查找错误信息"
fi

echo ""
print_header "如果问题仍未解决"
echo ""
echo "请提供以下信息："
echo "  1. 云函数 API 网关地址（隐藏密钥部分）"
echo "  2. 这个诊断脚本的输出结果"
echo "  3. 云函数的错误日志"
echo "  4. EdgeOne 的源站规则配置截图"
echo ""
