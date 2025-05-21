import os

print("测试 envFileX 扩展")
print("环境变量:")
print(f"DB_HOST = {os.environ.get('DB_HOST')}")
print(f"API_KEY = {os.environ.get('API_KEY')}")
print(f"DEBUG = {os.environ.get('DEBUG')}")
