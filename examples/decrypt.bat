@echo off

REM 解密 env 文件脚本
REM This script is an example to decrypt env values encrypted by base64
REM You can customize your own decrypt script to decrypt AWS/Aliyun KMS secrets or vault secrets.
REM 用法: decrypt.bat -f <env_file_path>

if "%1"=="-f" if not "%2"=="" if exist "%2" (
    for /f "usebackq tokens=* delims=" %%i in ("%2") do (
        set "line=%%i"
        REM 忽略注释和空行
        echo !line! | findstr "^#" >nul && (goto :continue) || (
        if "!line!"=="" (goto :continue))

        REM 解析 A=B 形式
        for /f "tokens=1,2 delims==" %%a in ("!line!") do (
            set "key=%%a"
            set "value=%%b"
            echo !value! | findstr "^secure:" >nul && (
                REM 去掉 secure: 前缀并 base64 解密
                set "encoded=!value:~7!"
                for /f "delims=" %%d in ('echo !encoded! ^| certutil -decode -') do set "decoded=%%d"
                echo !key!=!decoded!
            ) || (
                echo !key!=!value!
            )
        )
        :continue
    )
) else (
    REM 没有指定文件，返回默认环境变量
    echo DB_HOST=localhost
    echo API_KEY=default-key
    echo DEBUG=false
)

exit /b
