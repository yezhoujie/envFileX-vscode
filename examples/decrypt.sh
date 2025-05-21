#!/bin/bash

# 示例解密脚本
# 假定 .env.encrypted 是一个 base64 编码的文件

if [ "$1" == "-f" ] && [ -n "$2" ] && [ -f "$2" ]; then
  # 从加密文件解密
  cat "$2" | base64 -d
else
  # 没有指定文件，返回默认环境变量
  echo "DB_HOST=localhost"
  echo "API_KEY=default-key"
  echo "DEBUG=false"
fi
