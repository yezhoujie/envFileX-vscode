[中文文档 (Chinese README)](./README-zh_CN.md)

# envFileX - VS Code Extension

envFileX is a VSCode extension that allows you to flexibly inject environment variables into your debug process via the `envFileX` field in launch.json. You can merge multiple env files, process each env file with a custom script, or inject env variables directly from a script. Supports multi-language debugging (Java, Node.js, Python) and advanced features like multi-file, command scripts, and placeholder replacement.

## Features

- Flexibly inject environment variables via `envFileX` in launch.json
- Support merging multiple env files (array), with later files overriding earlier ones
- Support `command` field for custom shell scripts (e.g., decryption, remote fetch), auto-detects script content or path, supports VSCode variables
- Supports `${envFilexFilePath}` placeholder replacement in command
- Multi-language debugging: Java, Node.js, Python (debugpy)

## Supported Languages

- Java
- Node.js
- Python

## Quick Start

1. Add the `envFileX` field to your debug configuration in `.vscode/launch.json`:

```json
{
  "type": "node", // or "java", "debugpy"
  "request": "launch",
  "name": "Start App",
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

### Field Description

- `envFile`: string or string array, specify one or more env file paths
- `command`: optional, shell script content or path, supports VSCode variables and placeholders, especially `${envFilexFilePath}` which is replaced with the full path of the env file for the script
  - Example 1: `decrypt.sh -f ${envFilexFilePath}` — script receives the full env file path
  - Example 2: `echo "envFilexFilePath=${envFilexFilePath}"` — script outputs the env file path
  - Note: `${envFilexFilePath}` is only valid in `command`, not in `envFile`

### How It Works

1. Only `envFile`: directly read and merge all env files
2. Only `command`: execute the script, output KEY=VALUE pairs
3. Both: run command for each envFile, with placeholder replacement
4. Neither: do nothing

### Environment Variable Format

Whether from file or script, output must be standard KEY=VALUE lines:

```
DB_HOST=localhost
API_KEY=secret-key
DEBUG=true
```

## Examples

- See `examples/` for Java, Node.js, Python sample code and scripts
- `decrypt.sh`, `generate_env.sh` are sample env scripts
- `examples/launch_config_example` contains sample VSCode launch.json configurations

## How to build

### By manual

```shell
rm -rf package-lock.json
npm install --omit=dev
npm install --no-save typescript
npm run compile
npx vsce package
```

### Run build.sh

```shell
./build.sh
```

## FAQ

- Python requires 3.9+, specify python path if needed
- Java configs need `mainClass` and `classPaths`
- VSCode validation warnings are unrelated to this extension and can be ignored

## Windows Support

- Fully supports Windows batch (.bat) and PowerShell (.ps1) scripts and executable exe for env decryption/processing.
- Error output is automatically decoded as GBK or UTF-8 to avoid Chinese garbled text.
- See `examples/decrypt.bat` and `examples/decrypt.ps1` for Windows script samples.
- Example launch.json configuration for Windows:

```json
{
  "type": "node",
  "request": "launch",
  "name": "NodeJS Example - Windows .bat",
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

Or use PowerShell:

```json
{
  "type": "node",
  "request": "launch",
  "name": "NodeJS Example - Windows PowerShell",
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

Or use exe:

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

## Notes

**About environment variable hot-reload:**

Due to limitations in VSCode and some debuggers (such as node debugpy), if you modify the contents of environment variable files (e.g., `.env`) during debugging, simply clicking “Restart” will NOT make the extension reload the latest environment variables. In this case, please “Stop” the debugging session first, then “Start” it again to ensure the new environment variables are correctly injected.

Hot-reload support depends on future improvements in the VSCode debugging mechanism. If you have solutions or suggestions, feel free to submit an issue or PR.

## Contributing

- Issues and PRs welcome!
- GitHub: https://github.com/yezhoujie/envFileX-vscode

## License

MIT
