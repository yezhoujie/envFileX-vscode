# PowerShell 版本的 env 文件解密脚本
# 用法: .\decrypt.ps1 -f <env_file_path>
param(
    [string]$f
)

if ($f -and (Test-Path $f)) {
    Get-Content $f | ForEach-Object {
        $line = $_.Trim()
        # 忽略注释和空行
        if ($line -eq "" -or $line -match "^#") { return }
        # 解析 A=B 形式
        if ($line -match "^([^=]+)=(.*)$") {
            $key = $matches[1]
            $value = $matches[2]
            if ($value -like 'secure:*') {
                $encoded = $value.Substring(7)
                try {
                    $decoded = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($encoded))
                } catch {
                    $decoded = ""
                }
                Write-Output "$key=$decoded"
            } else {
                Write-Output "$key=$value"
            }
        }
    }
} else {
    Write-Output "DB_HOST=localhost"
    Write-Output "API_KEY=default-key"
    Write-Output "DEBUG=false"
}
