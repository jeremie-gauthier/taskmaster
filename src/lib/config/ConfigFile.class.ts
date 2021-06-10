import { isUndefined } from "../utils/index.ts";
import { Configuration } from "./types.ts";
export default class ConfigFile {
  private pathname: string;
  private _config: Configuration;

  private static instance: ConfigFile;

  private constructor(pathname: string) {
    this.pathname = pathname;
    this._config = this.loadConfigFile() as Configuration;
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

  private loadConfigFile() {
    const integrityCheck = (config: Record<string, unknown>) => {
      if (isUndefined(config.programs)) {
        throw new Error("Missing key [programs] in configuration");
      }
    };

    try {
      const configFileContent = Deno.readTextFileSync(this.pathname);
      const config = JSON.parse(configFileContent) as Record<string, unknown>;
      integrityCheck(config);
      console.log(`[*] Load config from file '${this.pathname}'`);
      return config;
    } catch (error) {
      console.error(
        `[-] Cannot read file '${this.pathname}' (${error.message})`,
      );
      Deno.exit();
    }
  }

  get programs() {
    return this._config.programs;
  }
}
