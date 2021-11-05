import Logger from "../logger/Logger.class.ts";
import { quitServer } from "../utils/daemon.ts";
import { isUndefined } from "../utils/index.ts";
import { Configuration, Programs } from "./types.ts";
export default class ConfigFile {
  private pathname: string;
  private _config: Configuration | null = null;

  private static instance: ConfigFile;

  private constructor(pathname: string) {
    this.pathname = pathname;
  }

  static getInstance(pathname?: string) {
    if (!ConfigFile.instance) {
      if (!pathname) {
        throw Error(
          "[-] Cannot read config file (a pathname to your config file is required)",
        );
      }
      ConfigFile.instance = new ConfigFile(pathname);
    }

    return ConfigFile.instance;
  }

  async loadConfigFile() {
    const integrityCheck = (config: Record<string, unknown>) => {
      if (isUndefined(config.logFile)) {
        throw new Error("Missing key [logFile] in configuration");
      }

      const logger = Logger.getInstance(config.logFile as string);
      logger.info("Checking configuration validity.");

      if (isUndefined(config.programs)) {
        throw new Error("Missing key [programs] in configuration");
      }
    };

    const programsCheck = (programs: Programs) => {
      for (const [progName, progConfig] of Object.entries(programs)) {
        if (!progName.match(/^\w+$/)) {
          throw new Error(`Error program ${progName} is not a valid name`);
        }

        if (!progConfig.cmd) {
          throw new Error(
            `Error program ${progName} does not specify a cmd in section 'programs:${progName}' (file: '${this.pathname}')`,
          );
        }

        if (
          progConfig.numProcs &&
          (isNaN(progConfig.numProcs) || progConfig.numProcs > 30)
        ) {
          throw new Error(
            `Error program ${progName} does not specify a number or defines too many subprocesses in section 'programs:${progName}:numProcs' (file: '${this.pathname}')`,
          );
        }

        if (
          progConfig.autoStart && progConfig.autoStart !== true &&
          progConfig.autoStart !== false
        ) {
          throw new Error(
            `Error program ${progName} does not specify a boolean in section 'programs:${progName}:autoStart' (file: '${this.pathname}')`,
          );
        }

        if (
          progConfig.autoRestart &&
          !["always", "unexpected", "never"].includes(progConfig.autoRestart)
        ) {
          throw new Error(
            `Error program ${progName} does not specify a one of allowed keywords ["always" | "unexpected" | "never"] in section 'programs:${progName}:autoRestart' (file: '${this.pathname}')`,
          );
        }

        if (
          progConfig.exitCodes && (!Array.isArray(progConfig.exitCodes) ||
            progConfig.exitCodes.some((code) => isNaN(code)))
        ) {
          throw new Error(
            `Error program ${progName} does not specify an array of number in section 'programs:${progName}:exitCodes' (file: '${this.pathname}')`,
          );
        }

        if (
          progConfig.startTime &&
          (isNaN(progConfig.startTime) || progConfig.startTime < 0)
        ) {
          throw new Error(
            `Error program ${progName} does not specify a valid number in section 'programs:${progName}:startTime' (file: '${this.pathname}')`,
          );
        }

        if (
          progConfig.startRetries &&
          (isNaN(progConfig.startRetries) || progConfig.startRetries < 0)
        ) {
          throw new Error(
            `Error program ${progName} does not specify a valid number in section 'programs:${progName}:startRetries' (file: '${this.pathname}')`,
          );
        }

        if (
          progConfig.stopSignal &&
          !["TERM", "HUP", "INT", "QUIT", "KILL", "USR1", "USR2"].includes(
            progConfig.stopSignal,
          )
        ) {
          throw new Error(
            `Error program ${progName} does not specify a valid signal ["TERM" | "HUP" | "INT" | "QUIT" | "KILL" | "USR1" | "USR2"] in section 'programs:${progName}:stopSignal' (file: '${this.pathname}')`,
          );
        }

        if (
          progConfig.stopTime &&
          (isNaN(progConfig.stopTime) || progConfig.stopTime < 0)
        ) {
          throw new Error(
            `Error program ${progName} does not specify a valid number in section 'programs:${progName}:stopTime' (file: '${this.pathname}')`,
          );
        }
      }

      const programsKeys = Object.keys(programs);
      const programsNumProcs = programsKeys.reduce((acc, progName) => {
        const progConfig = programs[progName];
        return acc + (progConfig.numProcs ?? 1);
      }, 0);
      if (programsNumProcs > 100) {
        throw new Error(
          `Error too many subprocesses from all sources (${programsNumProcs}) (max: 100) in configuration (file: '${this.pathname}')`,
        );
      }
    };

    try {
      const configFileContent = await Deno.readTextFile(this.pathname);
      const config = JSON.parse(configFileContent) as Record<string, unknown>;
      integrityCheck(config);

      // detect if the log file has changed
      if (this._config && config.logFile !== this._config.logFile) {
        await Logger.open(config.logFile as string);
      }

      this._config = config as Configuration;
      programsCheck(this._config.programs);
      Logger.getInstance().info("Configuration is valid.");
    } catch (error) {
      try {
        Logger.getInstance().error(
          `Configuration is invalid:\n${error.message}\nExiting...`,
        );
      } catch (_error) {
        // no logger
      }

      console.error(
        `Configuration is invalid:\n${error.message}\nExiting...`,
      );
      await quitServer();
    }
  }

  get config() {
    return this._config;
  }

  get programs() {
    return this._config?.programs;
  }
}
