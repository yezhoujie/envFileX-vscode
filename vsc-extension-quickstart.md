# envFileX 开发快速入门

这是一个指导如何使用 envFileX 插件的快速入门文档。

## 功能

envFileX 允许你在调试配置中读取环境变量文件并/或执行自定义脚本，然后将其注入到调试进程中。

## 使用方法

1. 在 `launch.json` 中为你的调试配置添加 `envFileX` 字段
2. 设置 `envFile` 路径和/或 `command` 脚本路径
3. 启动调试会话，环境变量将被自动注入

## 配置示例

```json
{
  "type": "node",
  "request": "launch",
  "name": "启动程序",
  "program": "${workspaceFolder}/app.js",
  "envFileX": {
    "command": "${workspaceFolder}/decrypt.sh",
    "envFile": "${workspaceFolder}/.env"
  }
}
```

## 工作模式说明

1. 如果指定了 `envFile` 但没有指定 `command`，插件将直接读取 `envFile` 文件内容
2. 如果指定了 `command` 和 `envFile`，插件将执行 `command` 脚本，并使用 `-f` 参数传入 `envFile` 完整文件路径
3. 如果指定了 `command` 但没有指定 `envFile`，插件将执行 `command` 脚本，不传递任何参数
4. 如果既没有指定 `command` 也没有指定 `envFile`，插件不进行任何操作

## 支持的语言

- Java
- Python
- Node.js

## 调试插件本身

1. 按 `F5` 启动调试会话
2. 在新窗口中打开一个包含示例文件的工作区
3. 使用示例配置启动调试会话
4. 查看调试控制台和输出面板中的日志信息

## 更多信息

- 查看 [README.md](README.md) 获取更多信息
- 有问题或建议? 在 GitHub 上提交 issue
