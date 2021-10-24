import { isUndefined } from "../utils/index.ts";
import { Configuration } from "./types.ts";
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
      if (isUndefined(config.programs)) {
        throw new Error("Missing key [programs] in configuration");
      }
    };

    try {
      const configFileContent = await Deno.readTextFile(this.pathname);
      const config = JSON.parse(configFileContent) as Record<string, unknown>;
      integrityCheck(config);
      // console.log(`[*] Load config from file '${this.pathname}'`);
      this._config = config as Configuration;
    } catch (error) {
      console.error(
        `[-] Cannot read file '${this.pathname}' (${error.message})`,
      );
      Deno.exit(1);
    }
  }

  get config() {
    return this._config;
  }

  get programs() {
    return this._config?.programs;
  }
}
