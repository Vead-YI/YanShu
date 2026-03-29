#!/bin/bash
# YanShu - GitHub 发布脚本
# 使用方法:
#   1. 在 GitHub 创建 Personal Access Token (PAT)
#      https://github.com/settings/tokens
#      权限: repo (完全控制私有仓库)
#   
#   2. 运行此脚本:
#      GITHUB_TOKEN=ghp_xxxxx ./scripts/publish.sh

set -e

REPO_NAME="YanShu"
DESCRIPTION="🌲 树状对话系统 - 让 AI 对话从铁轨变成森林"
USERNAME="Vead-YI"
TOKEN="${GITHUB_TOKEN:-}"

if [ -z "$TOKEN" ]; then
    echo "❌ 请设置 GITHUB_TOKEN 环境变量"
    echo ""
    echo "创建 Token 步骤:"
    echo "1. 访问: https://github.com/settings/tokens"
    echo "2. 点击 'Generate new token (classic)'"
    echo "3. 勾选 'repo' 权限"
    echo "4. 复制 Token 并运行:"
    echo "   GITHUB_TOKEN=ghp_xxx $0"
    exit 1
fi

cd "$(dirname "$0")/.."

echo "🔍 检查仓库是否已存在..."
EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $TOKEN" \
    "https://api.github.com/repos/$USERNAME/$REPO_NAME")

if [ "$EXISTS" = "200" ]; then
    echo "✅ 仓库已存在，跳过创建"
elif [ "$EXISTS" = "404" ]; then
    echo "📦 创建新仓库..."
    curl -s -X POST \
        -H "Authorization: token $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"$REPO_NAME\",\"description\":\"$DESCRIPTION\",\"private\":false,\"auto_init\":false}" \
        "https://api.github.com/user/repos"
    echo "✅ 仓库创建成功"
else
    echo "❌ 检查仓库失败 (HTTP $EXISTS)"
    exit 1
fi

echo "🔗 添加远程仓库..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://$USERNAME:$TOKEN@github.com/$USERNAME/$REPO_NAME.git"

echo "🚀 推送到 GitHub..."
git branch -M main
git push -u origin main --force

echo ""
echo "🎉 完成！"
echo "   仓库地址: https://github.com/$USERNAME/$REPO_NAME"
