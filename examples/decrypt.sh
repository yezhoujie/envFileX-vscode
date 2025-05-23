#!/bin/bash

# 解密 env 文件脚本
# this script is a example to decrypt env value which is encrypted by base64
# you can customize your own decrypt script to decrypt AWS/alyun KMS secret or vault secret.
# 用法: ./decrypt.sh -f <env_file_path>

if [ "$1" == "-f" ] && [ -n "$2" ] && [ -f "$2" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    # 忽略注释和空行
    if [[ "$line" =~ ^# ]] || [[ -z "$line" ]]; then
      continue
    fi
    # 解析 A=B 形式
    if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
      key="${BASH_REMATCH[1]}"
      value="${BASH_REMATCH[2]}"
      if [[ "$value" == secure:* ]]; then
        # 去掉 secure: 前缀并 base64 解密
        encoded="${value#secure:}"
        decoded=$(echo "$encoded" | base64 -d 2>/dev/null)
        echo "$key=$decoded"
      else
        echo "$key=$value"
      fi
    fi
  done < "$2"
else
  # 没有指定文件，返回默认环境变量
  echo "DB_HOST=localhost"
  echo "API_KEY=default-key"
  echo "DEBUG=false"
fi
