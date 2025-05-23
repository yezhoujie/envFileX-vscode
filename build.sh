#!/bin/bash
# envFileX VSCode 插件一键拉取、安装依赖、打包、发布脚本
# 使用说明：
# 1. 先配置好 package.json 的 publisher 字段和 icon 等元信息
# 2. 确保你已安装 git、node、npm、vsce（npm install -g vsce）
# 3. 执行 bash build.sh 即可完成全流程

set -e

# 1. 拉取最新代码
# REPO_URL="https://github.com/yezhoujie/envFileX-vscode.git"
# PROJECT_DIR="envFileX-vscode"
# if [ ! -d "$PROJECT_DIR" ]; then
#   echo "[INFO] 克隆仓库..."
#   git clone "$REPO_URL"
# fi
# cd "$PROJECT_DIR"
# echo "[INFO] 拉取最新代码..."
# git pull

# 2. 清理依赖，安装仅运行时依赖，避免 node_modules 缺失导致插件无法启动
rm -rf node_modules package-lock.json
npm install --omit=dev

# 3. 临时安装 typescript 以便打包时能编译（不写入 package.json）
npm install --no-save typescript

# 4. 确保 .vscodeignore 不排除 node_modules
if grep -q '^node_modules' .vscodeignore; then
  echo "[INFO] 注释 .vscodeignore 中的 node_modules 行"
  sed -i.bak 's/^node_modules/# node_modules/' .vscodeignore
fi

# 5. 编译 TypeScript
npm run compile

# 6. 打包 .vsix
npx vsce package

# 7. 可选：发布到 VSCode 市场（需先 vsce login <publisher>）
# npx vsce publish

# 8. 检查 .vsix 是否包含 node_modules 依赖
VSIX_FILE=$(ls *.vsix | tail -n 1)
echo "[INFO] 检查 .vsix 是否包含 node_modules..."
unzip -l "$VSIX_FILE" | grep node_modules || echo "[WARN] .vsix 未包含 node_modules，请检查依赖安装和 .vscodeignore 配置！"

echo "[SUCCESS] 打包完成：$VSIX_FILE"
