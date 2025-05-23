# envFileX 快速入门

本指南帮助你快速上手 envFileX 插件，体验多文件、脚本处理、占位符等高级环境变量注入能力。

## 主要功能

- 支持在 launch.json 中通过 envFileX 字段灵活注入环境变量
- 支持 envFile 多文件合并，后者覆盖前者
- 支持 command 字段，自定义 shell 脚本，自动识别脚本内容或路径，支持 VSCode 变量和占位符
- 支持 ${envFilexFilePath} 占位符自动替换
- 支持 Java、Node.js、Python（debugpy）多语言调试

## 支持语言

- Java
- Node.js
- Python

## 快速上手

1. 在 .vscode/launch.json 的调试配置中添加 `envFileX` 字段：

```json
{
  "type": "node", // 或 "java", "debugpy"
  "request": "launch",
  "name": "启动程序",
  "program": "${workspaceFolder}/examples/node/app.js",
  "envFileX": {
    "command": "${workspaceFolder}/examples/decrypt.sh -f ${envFilexFilePath}",
    "envFile": [
      "${workspaceFolder}/examples/.env.encrypted",
      "${workspaceFolder}/examples/.env"
    ]
  }
}
```

### 字段说明

- `envFile`：支持字符串或字符串数组，指定一个或多个环境变量文件路径
- `command`：可选，指定 shell 脚本内容或路径，支持 VSCode 变量和占位符，支持 ${envFilexFilePath} 占位符
  - 例 1：`decrypt.sh -f ${envFilexFilePath}`，脚本会接收到 envFile 的完整路径
  - 例 2：`echo "envFilexFilePath=${envFilexFilePath}"`，脚本会输出 envFile 的完整路径
  - 注意：`${envFilexFilePath}` 仅在 command 中有效

### 工作模式

1. 仅配置 envFile：直接读取并合并所有 env 文件
2. 仅配置 command：执行脚本，输出 KEY=VALUE 格式环境变量
3. 同时配置：每个 envFile 用 command 执行
4. 均未配置：不做任何处理

### 环境变量格式

无论通过文件还是脚本，均需输出标准 KEY=VALUE 格式：

```
DB_HOST=localhost
API_KEY=secret-key
DEBUG=true
```

## 示例

- examples/ 目录下包含 Java、Node.js、Python 示例代码和脚本
- decrypt.sh、generate_env.sh 为环境变量生成/解密脚本
- examples/launchConfig 文件夹下有 VSCode 的 launch.json 示例配置

## 常见问题

- Python 需 3.9+，建议指定 python 路径
- Java 项目需配置 mainClass、classPaths
- VSCode 校验警告与插件无关，可忽略

## 调试插件本身

1. 按 `F5` 启动调试会话
2. 在新窗口中打开一个包含示例文件的工作区
3. 使用示例配置启动调试会话
4. 查看调试控制台和输出面板中的日志信息

## 更多信息

- 查看 [README.md](README.md) 获取更多信息
- 有问题或建议? 在 GitHub 上提交 issue
