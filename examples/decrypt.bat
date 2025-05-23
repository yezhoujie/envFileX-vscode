@echo off
REM use utf-8 encoding to avoid garbled characters
chcp 65001 > nul
setlocal enabledelayedexpansion

REM 解密 env 文件脚本
REM 用法: decrypt.bat -f <env_file_path>

if "%1"=="-f" if not "%2"=="" if exist "%2" (
    for /f "usebackq tokens=* delims=" %%i in ("%2") do (
        set "line=%%i"
        REM 忽略注释和空行
        if not "!line!"=="" (
            echo !line! | findstr "^#" >nul
            if errorlevel 1 (
                REM 解析 A=B 形式
                for /f "tokens=1,2 delims==" %%a in ("!line!") do (
                    set "key=%%a"
                    set "value=%%b"
                    echo !value! | findstr "^secure:" >nul
                    if not errorlevel 1 (
                        set "encoded=!value:~7!"
                        set "tmpfile=%TEMP%\envfilex_b64.txt"
                        set "outfile=%TEMP%\envfilex_b64_out.txt"
                        echo !encoded!>!tmpfile!
                        certutil -decode !tmpfile! !outfile! >nul 2>&1
                        set /p decoded=<"!outfile!"
                        del /f /q "!tmpfile!" >nul 2>&1
                        del /f /q "!outfile!" >nul 2>&1
                        echo !key!=!decoded!
                    ) else (
                        echo !key!=!value!
                    )
                )
            )
        )
    )
) else (
    echo DB_HOST=localhost
    echo API_KEY=default-key
    echo DEBUG=false
)

exit /b
