# envFileX - VS Code 扩展

这是一个 VSCode 扩展，允许在 launch.json 中配置 envFileX 选项，用于读取环境变量文件并/或执行自定义 shell 脚本来处理环境变量，然后将其注入到调试进程中。

## 功能

- 从指定的 envFile 文件中读取环境变量
- 执行自定义 shell 脚本处理环境变量（如解密）
- 支持 Java、Python 和 Node.js 调试会话

## 使用方法

在 .vscode/launch.json 中为调试配置添加 `envFileX` 字段：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node", // 或 "java", "python"
      "request": "launch",
      "name": "启动程序",
      "program": "${workspaceFolder}/app.js",
      "envFileX": {
        "command": "${workspaceFolder}/decrypt.sh",
        "envFile": "${workspaceFolder}/.env"
      }
    }
  ]
}
```

### 参数说明

- `envFile`: 指定需要读取的环境变量文件路径。可选项，不填写时表明环境变量完全由 command 脚本生成
- `command`: 指定需要执行的 shell 脚本。可选项

### 工作模式

1. 如果未指定 command 但指定了 envFile，扩展将直接读取 envFile 文件内容
2. 如果未指定 command 且未指定 envFile，扩展不进行任何操作
3. 如果指定了 command 且指定了 envFile，扩展将执行 command 脚本，并使用 -f 参数传入 envFile 完整文件路径
4. 如果指定了 command 但未指定 envFile，扩展将执行 command 脚本，不传递任何参数

## 环境变量格式

无论是通过 envFile 读取还是通过 command 脚本生成，环境变量都应采用标准的 KEY=VALUE 格式：

```
DATABASE_URL=postgres://user:password@localhost:5432/db
API_KEY=secret-key
DEBUG=true
```

## 支持的语言

- Java
- Python
- Node.js

## 发布说明

### 0.1.0

- 初始版本
