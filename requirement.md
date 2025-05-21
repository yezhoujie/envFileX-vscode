# envFileX 开发需求文档

## 目标

开发一个 VSCode 插件，能够在 launch.json 中增加配置项以达到，读取 envFile 内容，并执行自定义 shell 脚本对文件内容进行解密等操作，并最终传递到程序启动/调试的进程中.

### 参数说明

```json
{
  "envFileX": {
    "command": "${workspaceFolder}/decrypt.sh",
    "envFile": "${workspaceFolder}/.env"
  }
}
```

- `envFile`: 指定需要读取的 envFile 文件路径,可选项，不填写时，为空,表明环境变量完全由 command 脚本生成
- `command`: 指定需要执行的 shell 脚本, 可选项
  1. 此配置项不填写，且 envFile 有值，默认读取 envFile 文件内容
  2. 此配置项不填写，且 envFile 没有值，什么都不做
  3. 此配置项填写，且 envFile 有值，执行 command 脚本，并使用 -f 参数传入 envFile 完整文件路径
  4. 此配置项填写，且 envFile 没有值，执行 command 脚本，不传递任何参数
  5. command 脚本的执行结果需要返回 KEY=VALUE 格式的字符串

### 功能说明

command 脚本默认读取 envFile 文件内容或者执行了自定义脚本输出了 KEY=VALUE 格式的字符串后，envFileX 插件会将其解析为环境变量，并传递到程序启动/调试的进程中.

#### 语言支持

java, python, nodejs
