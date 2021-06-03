export default class ConfigFile {
  private pathname!: string;
  private config!: Record<string, unknown>;

  private static instance: ConfigFile;

  private constructor(pathname: string) {
    const init = async () => {
      this.pathname = pathname;
      this.config = await this.loadConfigFile();
      return this;
    };

    init();
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

  private async loadConfigFile() {
    const configFileContent = await Deno.readTextFile(this.pathname);
    const config = JSON.parse(configFileContent);
    return config;
  }
}
