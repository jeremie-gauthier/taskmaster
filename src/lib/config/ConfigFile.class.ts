import Logger from "../logger/Logger.class.ts";
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
      }
    };

    try {
      const configFileContent = await Deno.readTextFile(this.pathname);
      const config = JSON.parse(configFileContent) as Record<string, unknown>;
      integrityCheck(config);
      this._config = config as Configuration;
      programsCheck(this._config.programs);
      Logger.getInstance().info("Configuration is valid.");
    } catch (error) {
      Logger.getInstance().error(
        `Configuration is invalid:\n${error.message}\nExiting...`,
      );
      // @ts-ignore Deno.signal is an experimental feature
      Deno.kill(Deno.pid, SignalCode["TERM"]);
    }
  }

  get config() {
    return this._config;
  }

  get programs() {
    return this._config?.programs;
  }
}
