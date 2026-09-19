#!/bin/bash

# 一键部署腾讯云云函数脚本

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

print_header "腾讯云云函数一键部署"

# 1. 检查 Serverless 框架
echo "检查 Serverless 框架..."
if ! command -v serverless &> /dev/null; then
    print_warning "Serverless 未安装，正在安装..."
    npm install -g serverless
fi

SERVERLESS_VERSION=$(serverless -v)
print_ok "Serverless 已安装: $SERVERLESS_VERSION"

# 2. 检查凭证
echo ""
print_header "检查腾讯云凭证"
echo "检查凭证配置..."

if ! serverless credentials list | grep -q "tencent"; then
    print_error "未找到腾讯云凭证配置"
    echo ""
    echo "请执行以下命令配置凭证："
    echo "  serverless credentials set --provider tencent \\"
    echo "    --id YOUR_SECRET_ID \\"
    echo "    --key YOUR_SECRET_KEY"
    echo ""
    echo "获取凭证方法："
    echo "  1. 登录: https://console.cloud.tencent.com"
    echo "  2. 进入: 访问管理 -> API密钥管理"
    echo "  3. 创建新密钥"
    exit 1
fi

print_ok "腾讯云凭证已配置"

# 3. 检查 serverless.yml
echo ""
print_header "检查配置文件"
if [ ! -f "serverless.yml" ]; then
    print_error "serverless.yml 不存在"
    exit 1
fi
print_ok "serverless.yml 已找到"

# 4. 检查 API 代码
if [ ! -f "api/translate/index.js" ]; then
    print_error "api/translate/index.js 不存在"
    exit 1
fi
print_ok "云函数代码已找到"

# 5. 检查环境变量
echo ""
print_header "检查环境变量"
if [ ! -f ".env.local" ]; then
    print_error ".env.local 不存在"
    exit 1
fi

if ! grep -q "TENCENT_CLOUD_SECRET_ID=" .env.local; then
    print_error "TENCENT_CLOUD_SECRET_ID 未配置"
    exit 1
fi

print_ok "环境变量已配置"

# 6. 部署云函数
echo ""
print_header "部署云函数"
echo "部署中，请稍候..."

if serverless deploy; then
    print_ok "云函数部署成功！"
    echo ""
    echo "部署信息："
    serverless info
else
    print_error "云函数部署失败"
    print_warning "查看详细错误："
    serverless deploy --debug
    exit 1
fi

# 7. 显示后续步骤
echo ""
print_header "后续步骤"
echo ""
echo -e "${YELLOW}1. 获取云函数的 API 网关地址：${NC}"
echo "   从上面的部署信息中找到 API Gateway URL"
echo ""
echo -e "${YELLOW}2. 配置 EdgeOne 路由规则：${NC}"
echo "   1. 登录腾讯云 EdgeOne 控制台"
echo "   2. 进入 '源站配置'"
echo "   3. 添加回源规则："
echo "      - 路径: /api/*"
echo "      - 源站类型: API 网关"
echo "      - 源站地址: [上面获取的 API 网关 URL]"
echo ""
echo -e "${YELLOW}3. 部署前端到 EdgeOne：${NC}"
echo "   npm run build"
echo "   git add ."
echo "   git commit -m 'deploy: 添加云函数后端'"
echo "   git push origin main"
echo ""
echo -e "${YELLOW}4. 验证部署：${NC}"
echo "   1. 等待 EdgeOne 部署完成"
echo "   2. 打开应用: https://vox-reader-dp6yr5iwyskv.edgeone.cool"
echo "   3. 测试翻译功能"
echo ""

print_ok "云函数部署完成！"
print_warning "请继续按照上述步骤配置 EdgeOne 和部署前端"
