# 更新日志

所有 envFileX 项目的显著更改都将记录在此文件中。

## [0.1.5] - 2025-05-24

### 重要修复与优化
- 修复依赖未被打包导致插件无法激活的问题，明确 node_modules 不能被 .vscodeignore 排除，保证 iconv-lite 等依赖被正确打包进 .vsix
- 新增 build.sh 一键打包脚本，自动处理依赖安装、.vscodeignore 注释、TypeScript 编译、vsce 打包、依赖检查等流程，避免 node_modules 缺失等常见问题
- 文档和注释补充 node_modules 打包注意事项，防止后续误操作
- 优化打包流程，确保插件在所有平台下都能正常激活

## [0.1.2] - 2025-05-24

### 新增
- 完善 Windows 平台支持：
  - 支持 .bat、PowerShell(.ps1) 脚本作为解密/处理脚本
  - 自动处理 Windows 命令行参数引号，避免语法错误
  - 错误输出自动尝试 GBK/UTF-8 解码，解决中文乱码问题
  - 提供 decrypt.bat、decrypt.ps1 示例脚本
  - 文档补充 Windows 配置示例
- 优化 launch.json 示例，区分 Windows/Linux 脚本用法
- 修复部分批处理脚本语法问题

## [0.1.1] - 2025-05-21

### 新增

- 增加插件 icon

## [0.1.0] - 2025-05-21

### 新增

- 首次发布
- 支持在 launch.json 中配置 envFileX 选项
- 支持读取环境变量文件
- 支持执行自定义脚本处理环境变量
- 支持 Java, Python, Node.js 调试类型
- 提供示例和文档
