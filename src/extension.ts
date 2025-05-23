import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { execSync } from "child_process";
import * as os from "os";

// 日志输出通道
let outputChannel: vscode.OutputChannel;

/**
 * 日志输出函数
 */
function log(message: string) {
  const timestamp = new Date().toISOString();
  outputChannel.appendLine(`[${timestamp}] ${message}`);
  console.log(`[envFileX] ${message}`);
}

/**
 * 激活扩展时调用
 */
export function activate(context: vscode.ExtensionContext) {
  // 创建输出通道
  outputChannel = vscode.window.createOutputChannel("envFileX");
  outputChannel.show(true);
  log("envFileX 扩展已激活");

  // 注册调试会话工厂
  context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider(
      "java",
      new EnvFileXConfigurationProvider()
    ),
    vscode.debug.registerDebugConfigurationProvider(
      "node",
      new EnvFileXConfigurationProvider()
    ),
    vscode.debug.registerDebugConfigurationProvider(
      "debugpy",
      new EnvFileXConfigurationProvider()
    )
  );
}

/**
 * 实现调试配置提供器
 */
class EnvFileXConfigurationProvider
  implements vscode.DebugConfigurationProvider
{
  /**
   * 在启动调试会话前解析配置
   */
  async resolveDebugConfiguration(
    folder: vscode.WorkspaceFolder | undefined,
    config: vscode.DebugConfiguration,
    token?: vscode.CancellationToken
  ): Promise<vscode.DebugConfiguration> {
    if (!config.envFileX) {
      return config;
    }
    log(`开始处理调试配置: ${config.name}`);
    try {
      const envFileXConfig = config.envFileX as {
        envFile?: string | string[];
        command?: string;
      };
      log(`envFileX 配置: ${JSON.stringify(envFileXConfig)}`);
      // 统一 envFile 为数组
      let envFiles: string[] = [];
      if (Array.isArray(envFileXConfig.envFile)) {
        envFiles = envFileXConfig.envFile;
      } else if (
        typeof envFileXConfig.envFile === "string" &&
        envFileXConfig.envFile.trim()
      ) {
        envFiles = [envFileXConfig.envFile];
      }
      envFiles = envFiles
        .map((f) => resolveVariables(f, folder))
        .filter(Boolean);
      const commandScript = envFileXConfig.command || "";
      log(
        `解析后的 envFiles: ${JSON.stringify(envFiles)}, 有无命令脚本: ${
          commandScript ? "是" : "否"
        }`
      );
      let envVars: Record<string, string> = {};
      if (envFiles.length === 0 && !commandScript) {
        log("未配置 command 和 envFile，不进行操作");
      } else if (envFiles.length === 0 && commandScript) {
        // 只有 command
        log(`仅执行脚本内容`);
        envVars = executeCommandScript(commandScript, [], undefined, folder);
        log(`脚本执行成功，获取到 ${Object.keys(envVars).length} 个环境变量`);
      } else if (envFiles.length > 0 && !commandScript) {
        // 只有 envFile，合并所有 env 文件，后者覆盖前者
        for (const file of envFiles) {
          log(`读取环境变量文件: ${file}`);
          const vars = readEnvFile(file);
          envVars = { ...envVars, ...vars };
        }
        log(
          `成功合并 ${envFiles.length} 个 env 文件，最终 ${
            Object.keys(envVars).length
          } 个环境变量`
        );
      } else if (envFiles.length > 0 && commandScript) {
        // envFile 和 command 都有值，每个 envFile 用 command 执行，command 中用 ${envFilexFilePath} 占位符
        for (const file of envFiles) {
          const vars = executeCommandScript(commandScript, [], file, folder);
          envVars = { ...envVars, ...vars };
        }
        log(
          `所有 envFile+command 执行完毕，最终 ${
            Object.keys(envVars).length
          } 个环境变量`
        );
      }
      config.env = { ...config.env, ...envVars };
      const envKeys = Object.keys(envVars);
      log(`成功注入环境变量: ${envKeys.join(", ")}`);
    } catch (error) {
      const errorMessage = `错误: ${
        error instanceof Error ? error.message : String(error)
      }`;
      log(errorMessage);
      vscode.window.showErrorMessage(`envFileX: ${errorMessage}`);
    }
    return config;
  }
}

/**
 * 解析路径中的变量
 */
function resolveVariables(
  value: string,
  folder?: vscode.WorkspaceFolder
): string {
  if (!value) {
    return value;
  }

  // 替换 ${workspaceFolder}
  if (folder) {
    value = value.replace(/\${workspaceFolder}/g, folder.uri.fsPath);
  }

  // 替换 ${env:NAME} 形式的环境变量
  value = value.replace(/\${env:([^}]+)}/g, (match, envName) => {
    const envValue = process.env[envName];
    return envValue !== undefined ? envValue : match;
  });

  // 替换 ~ 为用户主目录
  if (value.startsWith("~")) {
    value = path.join(os.homedir(), value.slice(1));
  }

  return value;
}

/**
 * 读取环境变量文件
 */
function readEnvFile(filePath: string): Record<string, string> {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`环境变量文件不存在: ${filePath}`);
    }

    log(`读取文件内容: ${filePath}`);
    const content = fs.readFileSync(filePath, "utf8");
    return parseEnvVars(content);
  } catch (error) {
    throw new Error(
      `无法读取环境变量文件: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * 执行脚本内容或脚本路径获取环境变量
 * @param scriptOrPath 脚本内容或脚本路径
 * @param args 传递给脚本的参数
 * @param envFilexFilePath envFilexFilePath 占位符替换值
 * @param folder 工作区文件夹
 */
function executeCommandScript(
  scriptOrPath: string,
  args: string[] = [],
  envFilexFilePath?: string,
  folder?: vscode.WorkspaceFolder
): Record<string, string> {
  try {
    log(`准备执行脚本内容或脚本路径`);
    // 先做变量替换，支持 VSCode 占位符
    let resolvedScriptOrPath = resolveVariables(scriptOrPath, folder);
    // Windows 平台特殊处理
    if (process.platform === "win32") {
      log("检测到 Windows 平台，直接执行 command");
      try {
        // 支持 ${envFilexFilePath} 占位符
        let winCommand = resolvedScriptOrPath;
        if (envFilexFilePath) {
          winCommand = winCommand.replace(
            /\${envFilexFilePath}/g,
            envFilexFilePath
          );
        }
        const fullCommand =
          winCommand + (args.length > 0 ? " " + args.join(" ") : "");
        log(`Windows 下执行命令: ${fullCommand}`);
        const output = execSync(fullCommand, {
          encoding: "utf8",
          timeout: 10000,
        });
        log("命令执行成功，开始解析输出");
        return parseEnvVars(output);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        log(`Windows 命令执行失败: ${errMsg}`);
        vscode.window.showErrorMessage(`envFileX (Windows): ${errMsg}`);
        return {};
      }
    }
    let scriptContent = resolvedScriptOrPath;
    // 判断是否为现有文件路径（绝对、相对、./、/ 开头，且文件存在）
    const isPath =
      (resolvedScriptOrPath.startsWith("/") ||
        resolvedScriptOrPath.startsWith("./") ||
        resolvedScriptOrPath.endsWith(".sh") ||
        resolvedScriptOrPath.endsWith(".bash")) &&
      fs.existsSync(path.resolve(resolvedScriptOrPath));
    if (isPath) {
      const absPath = path.resolve(resolvedScriptOrPath);
      log(`command 被识别为脚本路径: ${absPath}`);
      scriptContent = fs.readFileSync(absPath, "utf8");
    }
    // 替换占位符
    if (envFilexFilePath) {
      scriptContent = scriptContent.replace(
        /\${envFilexFilePath}/g,
        envFilexFilePath
      );
    }
    // 创建临时脚本文件
    const tmpDir = os.tmpdir();
    const scriptFileName = `envfilex-script-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.sh`;
    const scriptPath = path.join(tmpDir, scriptFileName);
    fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });
    log(`创建临时脚本文件: ${scriptPath}`);
    try {
      const fullCommand = `"${scriptPath}" ${args.join(" ")}`;
      log(`执行命令: ${fullCommand}`);
      log(`执行命令: ${scriptContent}`);
      const output = execSync(fullCommand, {
        encoding: "utf8",
        timeout: 10000,
      });
      log(`脚本执行成功，开始解析输出`);
      return parseEnvVars(output);
    } finally {
      try {
        fs.unlinkSync(scriptPath);
        log(`删除临时脚本文件: ${scriptPath}`);
      } catch (error) {
        log(
          `删除临时脚本文件失败: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  } catch (error) {
    throw new Error(
      `执行脚本内容失败: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * 解析环境变量字符串为对象
 */
function parseEnvVars(content: string): Record<string, string> {
  const envVars: Record<string, string> = {};
  const lines = content.split("\n");
  let lineCount = 0;
  let validLineCount = 0;

  for (const line of lines) {
    lineCount++;
    // 忽略注释和空行
    const trimmedLine = line.trim();
    if (trimmedLine === "" || trimmedLine.startsWith("#")) {
      continue;
    }

    // 查找第一个等号
    const eqIndex = trimmedLine.indexOf("=");
    if (eqIndex > 0) {
      const key = trimmedLine.substring(0, eqIndex).trim().toUpperCase();
      let value = trimmedLine.substring(eqIndex + 1).trim();

      // 处理引号
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.substring(1, value.length - 1);
      }

      envVars[key] = value;
      validLineCount++;
    } else {
      log(`警告: 第 ${lineCount} 行不符合 KEY=VALUE 格式: ${trimmedLine}`);
    }
  }

  log(`解析了 ${lineCount} 行，找到 ${validLineCount} 个有效的环境变量`);
  return envVars;
}

/**
 * 停用扩展时调用
 */
export function deactivate() {
  log("envFileX 扩展已停用");
  outputChannel.dispose();
}
