#!/bin/bash

# vox-reader 部署诊断脚本 - 快速检查部署配置

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check_item() {
    local name=$1
    local status=$2
    if [ "$status" = "OK" ]; then
        echo -e "${GREEN}✅${NC} $name"
    else
        echo -e "${RED}❌${NC} $name: $status"
    fi
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}vox-reader 部署诊断${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 1. 检查环境
echo -e "${YELLOW}[1/6] 环境检查${NC}"
if command -v node &> /dev/null; then
    check_item "Node.js" "OK ($(node -v))"
else
    check_item "Node.js" "未安装"
fi

if command -v npm &> /dev/null; then
    check_item "npm" "OK"
else
    check_item "npm" "未安装"
fi

if command -v pnpm &> /dev/null; then
    check_item "pnpm" "OK ($(pnpm -v))"
else
    check_item "pnpm" "未安装"
fi
echo ""

# 2. 检查项目文件
echo -e "${YELLOW}[2/6] 项目文件检查${NC}"
[ -f "package.json" ] && check_item "package.json" "OK" || check_item "package.json" "缺失"
[ -f ".env.local" ] && check_item ".env.local" "OK" || check_item ".env.local" "缺失"
[ -f "vite.config.ts" ] && check_item "vite.config.ts" "OK" || check_item "vite.config.ts" "缺失"
[ -f "server/index.mjs" ] && check_item "server/index.mjs" "OK" || check_item "server/index.mjs" "缺失"
echo ""

# 3. 检查环境变量配置
echo -e "${YELLOW}[3/6] 环境变量配置检查${NC}"

if [ -f ".env.local" ]; then
    if grep -q "TENCENT_CLOUD_SECRET_ID=" .env.local; then
        if grep "TENCENT_CLOUD_SECRET_ID=" .env.local | grep -q "AKIDRjsthKUZcn"; then
            check_item "腾讯云凭证" "⚠️ 包含敏感信息（请妥善保管）"
        else
            check_item "腾讯云凭证" "已配置"
        fi
    else
        check_item "腾讯云凭证" "未配置"
    fi

    if grep -q "VITE_API_BASE_URL=http" .env.local; then
        check_item "API_BASE_URL" "⚠️ 设置为绝对URL（生产环境应使用相对路径）"
        echo "    修复: 删除或注释掉 VITE_API_BASE_URL 行"
    else
        check_item "API_BASE_URL" "正确（使用相对路径 /api）"
    fi
else
    check_item ".env.local 存在" "缺失"
fi
echo ""

# 4. 检查构建
echo -e "${YELLOW}[4/6] 构建检查${NC}"
if [ -d "dist" ]; then
    check_item "dist 目录" "OK"
    file_count=$(find dist -type f | wc -l)
    check_item "dist 文件数" "OK ($file_count 个文件)"

    if [ -f "dist/index.html" ]; then
        check_item "dist/index.html" "OK"
    else
        check_item "dist/index.html" "缺失"
    fi
else
    check_item "dist 目录" "缺失 (请运行: npm run build)"
fi
echo ""

# 5. 检查依赖
echo -e "${YELLOW}[5/6] 依赖检查${NC}"
if [ -d "node_modules" ]; then
    check_item "node_modules" "OK"
else
    check_item "node_modules" "缺失 (请运行: pnpm install)"
fi

if [ -f "pnpm-lock.yaml" ]; then
    check_item "pnpm-lock.yaml" "OK"
elif [ -f "package-lock.json" ]; then
    check_item "package-lock.json" "OK"
else
    check_item "锁定文件" "缺失"
fi
echo ""

# 6. 网络和服务检查
echo -e "${YELLOW}[6/6] 服务检查${NC}"
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    check_item "后端服务 (3000)" "运行中"
else
    check_item "后端服务 (3000)" "未运行"
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    check_item "前端服务 (5173)" "运行中"
else
    check_item "前端服务 (5173)" "未运行"
fi

if command -v nginx &> /dev/null; then
    if systemctl is-active --quiet nginx; then
        check_item "Nginx" "运行中"
    else
        check_item "Nginx" "已安装但未运行"
    fi
else
    check_item "Nginx" "未安装"
fi
echo ""

# 生成建议
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}建议${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "📋 快速启动步骤:"
echo ""
echo "1️⃣ 本地开发/测试:"
echo "   ./start-production.sh all"
echo ""
echo "2️⃣ 服务器部署 (推荐):"
echo "   # 第一次设置"
echo "   sudo bash setup-nginx.sh"
echo "   # 然后启动后端"
echo "   ./start-production.sh backend-only"
echo ""
echo "3️⃣ 完整诊断:"
echo "   bash diagnose-full.sh"
echo ""
echo "📚 详细指南请查看: DEPLOYMENT-GUIDE.md"
echo ""
