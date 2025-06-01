import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { execSync } from "child_process";
import * as os from "os";
import * as iconv from "iconv-lite"; // 新增：引入 iconv-lite 以支持 GBK 解码

// 日志输出通道
let outputChannel: vscode.OutputChannel;

/**
 * 日志输出函数，支持分级和国际化
 * @param message 日志内容（可为 l10n key 或普通字符串）
 * @param level 日志级别 info/warn/error，默认info
 * @param l10nArgs 国际化参数（可选）
 */
function log(
  message: string,
  level: "info" | "warn" | "error" = "info",
  l10nArgs?: any[]
) {
  const timestamp = new Date().toISOString();
  let prefix = "[INFO ]";
  let color = "\x1b[32m"; // 绿色
  let icon = "";
  if (level === "warn") {
    prefix = "[WARN ]";
    color = "\x1b[33m"; // 黄色
    icon = "⚠️ ";
  } else if (level === "error") {
    prefix = "[ERROR]";
    color = "\x1b[31m"; // 红色
    icon = "❌ ";
  }
  // 判断 message 是否为 l10n key，若是则国际化，否则原样输出
  let outputMsg = message;
  if (message && message.startsWith("envFileX.")) {
    try {
      outputMsg = vscode.l10n.t(message, ...(l10nArgs || []));
    } catch {
      // 若 key 不存在则降级为原文
      outputMsg = message;
    }
  }
  outputChannel.appendLine(`${icon}${prefix} [${timestamp}] ${outputMsg}`);
  // 终端彩色输出
  if (level === "info") {
    console.log(`${color}[envFileX]${prefix}\x1b[0m ${outputMsg}`);
  } else if (level === "warn") {
    // 用 console.log 保证黄色生效
    console.log(`${color}[envFileX]${prefix}${icon}\x1b[0m ${outputMsg}`);
  } else if (level === "error") {
    console.error(`${color}[envFileX]${prefix}${icon}\x1b[0m ${outputMsg}`);
  }
}

/**
 * 激活扩展时调用
 */
export function activate(context: vscode.ExtensionContext) {
  // 创建输出通道
  outputChannel = vscode.window.createOutputChannel("envFileX");
  outputChannel.show(true);

  log("envFileX.log.activated");
  vscode.window.showInformationMessage(vscode.l10n.t("envFileX.log.activated"));

  // 注册调试会话工厂
  context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider(
      "java",
      new EnvFileXConfigurationProvider()
    ),
    vscode.debug.registerDebugConfigurationProvider(
      "pwa-node",
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
    // vscode自带的envFile 和 envFileX 配置 同时存在
    if (config.envFile && config.envFileX) {
      log("envFileX.warning.envFileAndEnvFileX", "warn");
      vscode.window.showWarningMessage(
        vscode.l10n.t("envFileX.warning.envFileAndEnvFileX")
      );
    }
    if (!config.envFileX) {
      return config;
    }
    log("envFileX.log.splitLine");
    log("envFileX.log.startProcess", "info", [config.name]);
    try {
      const envFileXConfig = config.envFileX as {
        envFile?: string | string[];
        command?: string;
      };
      log("envFileX.log.config", "info", [JSON.stringify(envFileXConfig)]);
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
      log("envFileX.log.envFilesParsed", "info", [
        JSON.stringify(envFiles),
        commandScript ? "是" : "否",
      ]);
      log("\n");
      let envVars: Record<string, string> = {};
      if (envFiles.length === 0 && !commandScript) {
        log("envFileX.log.noCommandNoEnvFile");
      } else if (envFiles.length === 0 && commandScript) {
        // 只有 command
        log("envFileX.log.onlyScript");
        envVars = executeCommandScript(commandScript, [], undefined, folder);
        log("envFileX.log.scriptVars", "info", [Object.keys(envVars).length]);
      } else if (envFiles.length > 0 && !commandScript) {
        // 只有 envFile，合并所有 env 文件，后者覆盖前者
        for (const file of envFiles) {
          log("envFileX.log.readEnvFile", "info", [file]);
          const vars = readEnvFile(file);
          envVars = { ...envVars, ...vars };
        }
        log("envFileX.log.mergeEnvFiles", "info", [
          envFiles.length,
          Object.keys(envVars).length,
        ]);
      } else if (envFiles.length > 0 && commandScript) {
        // envFile 和 command 都有值，每个 envFile 用 command 执行，command 中用 ${envFilexFilePath} 占位符
        for (const file of envFiles) {
          const vars = executeCommandScript(commandScript, [], file, folder);
          envVars = { ...envVars, ...vars };
        }
        log("envFileX.log.envAndScriptVars", "info", [
          Object.keys(envVars).length,
        ]);
      }
      config.env = { ...config.env, ...envVars };
      const envKeys = Object.keys(envVars);
      log("envFileX.log.injected", "info", [envKeys.join(", ")]);
      log("\n\n");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      log("envFileX.log.error", "error", [errorMessage]);
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
      throw new Error(
        vscode.l10n.t("envFileX.error.envFileNotExist", filePath)
      );
    }
    log("envFileX.log.readFileContent", "info", [filePath]);
    const content = fs.readFileSync(filePath, "utf8");
    return parseEnvVars(content);
  } catch (error) {
    throw new Error(
      vscode.l10n.t(
        "envFileX.error.readEnvFile",
        error instanceof Error ? error.message : String(error)
      )
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
        // 直接用 winCommand 字符串，无需拆分数组
        const fullCommand = `chcp 65001 >nul && ${winCommand} ${args
          .map((arg) => `"${arg}"`)
          .join(" ")}`;
        log(`Windows 下执行命令 (UTF-8 编码): ${fullCommand}`);
        const output = execSync(fullCommand, {
          encoding: "buffer",
          timeout: 10000,
        });
        log("命令执行成功，开始解析输出");
        return parseEnvVars(output.toString("utf8"));
      } catch (error) {
        // --- 关键：优先用 GBK 解码错误输出 ---
        let errMsg = "";
        let stdout = (error as any).stdout;
        let stderr = (error as any).stderr;
        try {
          if (Buffer.isBuffer(stdout)) stdout = stdout.toString("utf8");
          if (Buffer.isBuffer(stderr)) stderr = stderr.toString("utf8");
        } catch {
          if (Buffer.isBuffer(stdout)) stdout = iconv.decode(stdout, "gbk");
          if (Buffer.isBuffer(stderr)) stderr = iconv.decode(stderr, "gbk");
        }
        errMsg = `${
          error instanceof Error ? error.message : String(error)
        }\nstdout: ${stdout}\nstderr: ${stderr}`;
        log("envFileX.log.winCmdFail", "error", [errMsg]);
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
      log("envFileX.log.cmdPath", "info", [absPath]);
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
    // log(`创建临时脚本文件: ${scriptPath}`);
    try {
      const fullCommand = `"${scriptPath}" ${args.join(" ")}`;
      // log(`执行命令: ${fullCommand}`);
      log("envFileX.log.execCmd", "info", [scriptContent]);
      const output = execSync(fullCommand, {
        encoding: "utf8",
        timeout: 10000,
      });
      log("envFileX.log.scriptSuccess");
      log(`脚本执行成功，开始解析输出`);
      return parseEnvVars(output);
    } finally {
      try {
        fs.unlinkSync(scriptPath);
        // log(`删除临时脚本文件: ${scriptPath}`);
      } catch (error) {
        log("envFileX.log.rmTmpFail", "error", [
          error instanceof Error ? error.message : String(error),
        ]);
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
      log("envFileX.log.invalidLine", "warn", [lineCount, trimmedLine]);
    }
  }

  log("envFileX.log.parseResult", "info", [lineCount, validLineCount]);
  log("\n");
  return envVars;
}

/**
 * 停用扩展时调用
 */
export function deactivate() {
  log("envFileX.log.deactivate");
  outputChannel.dispose();
}
