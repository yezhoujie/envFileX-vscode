[English README (英文文档)](./README.md)

# envFileX - VS Code 扩展（中文）

envFileX 是一个 VSCode 扩展，允许你在 launch.json 中通过 envFileX 字段将多个 env 文件灵活注入环境变量，也可对每个 env 文件进行额外的脚本处理后注入，也可以直接通过执行脚本向程序注入环境变量。支持多语言调试（Java、Node.js、Python），并具备多文件、命令脚本、占位符替换等高级特性。

## 主要功能

- 支持在 launch.json 中通过 envFileX 字段灵活注入环境变量
- 支持 envFile 多文件合并，后者覆盖前者
- 支持 command 字段，自定义 shell 脚本，来处理 env 文件的解密，远程拉取等操作。自动识别脚本内容或路径，支持 VSCode 变量
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
- `command`：可选，指定 shell 脚本内容或路径，支持 VSCode 变量和占位符, 支持 ${envFilexFilePath} 占位符，${envFilexFilePath}占位符是本插件提供给 command 脚本的 envFile 完整路径参数, 可以在路径或者脚本文件内部使用
  - 例子 1：`decrypt.sh -f ${envFilexFilePath}`，脚本会接收到 envFile 的完整路径
  - 例子 2：`echo "envFilexFilePath=${envFilexFilePath}"`，脚本会输出 envFile 的完整路径
  - 注意：`${envFilexFilePath}` 仅在 command 中有效，envFile 中无效

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
- examples/launch_config_example 文件夹下是 VSCode 的 launch.json 示例配置

## 构建

### 手动构建

```shell
rm -rf package-lock.json
npm install --omit=dev
npm install --no-save typescript
npm run compile
npx vsce package
```

### 使用构建脚本

```shell
./build.sh
```

## Windows 支持

- 完善支持 Windows 下 .bat 批处理和 PowerShell(.ps1) 脚本以及可执行 ext 作为解密/处理脚本
- 错误输出自动尝试 GBK/UTF-8 解码，解决中文乱码
- 示例脚本见 `examples/decrypt.bat` 和 `examples/decrypt.ps1`
- Windows 下 launch.json 配置示例：

```json
{
  "type": "node",
  "request": "launch",
  "name": "NodeJS 示例 - Windows .bat",
  "program": "${workspaceFolder}/examples/node/app.js",
  "envFileX": {
    "command": "cmd.exe /C ${workspaceFolder}\\examples\\decrypt.bat -f ${envFilexFilePath}",
    "envFile": [
      "${workspaceFolder}\\examples\\.env.encrypted",
      "${workspaceFolder}\\examples\\.env"
    ]
  }
}
```

或使用 PowerShell：

```json
{
  "type": "node",
  "request": "launch",
  "name": "NodeJS 示例 - Windows PowerShell",
  "program": "${workspaceFolder}/examples/node/app.js",
  "envFileX": {
    "command": "powershell.exe -ExecutionPolicy Bypass -File ${workspaceFolder}\\examples\\decrypt.ps1 -f ${envFilexFilePath}",
    "envFile": [
      "${workspaceFolder}\\examples\\.env.encrypted",
      "${workspaceFolder}\\examples\\.env"
    ]
  }
}
```

或者使用可执行 exe 程序：

```json
{
  "type": "node",
  "request": "launch",
  "name": "NodeJS 示例 - Windows PowerShell",
  "program": "${workspaceFolder}/examples/node/app.js",
  "envFileX": {
    "command": "${workspaceFolder}\\examples\\kms-client.exe -f ${envFilexFilePath}",
    "envFile": [
      "${workspaceFolder}\\examples\\.env.encrypted",
      "${workspaceFolder}\\examples\\.env"
    ]
  }
}
```

## 注意事项

### 关于环境变量热重载：

由于 VSCode 及部分调试器（如 node debugpy）机制限制，如果你在调试过程中修改了环境变量文件（如 `.env`）的内容，直接点击“重启（Restart）”是无法让插件重新加载最新的环境变量的。此时请先“停止（Stop）”调试，再重新启动（Start）调试会话，才能确保新的环境变量被正确注入。

热重载支持需要等待 VSCode 官方调试机制的改进。如果你有解决方案或建议，欢迎提交 issue 或 PR。

---

### ⚠️ 注意：不要同时使用 `envFile` 和 `envFileX`

如果在 launch.json 中同时配置了 `envFile` 和 `envFileX`，最终注入到调试进程的环境变量可能会被覆盖或出现不可预期的行为。这是因为各语言调试器（如 Node.js、Java、Python 等）加载环境变量的机制不统一，变量加载顺序无法保证。强烈建议只使用 `envFileX` 字段进行环境变量注入，并移除 `envFile` 字段，以避免冲突和混乱。

## 常见问题

- Python 需 3.9+，建议指定 python 路径
- Java 项目需配置 mainClass、classPaths
- VSCode 校验警告与插件无关，可忽略

## 贡献与反馈

- 欢迎提交 issue 或 PR
- GitHub: https://github.com/yezhoujie/envFileX-vscode

## License

MIT
