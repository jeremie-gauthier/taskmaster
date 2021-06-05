export default class ConfigFile {
  private pathname: string;
  private config: Record<string, unknown>;

  private static instance: ConfigFile;

  private constructor(pathname: string) {
    this.pathname = pathname;
    this.config = this.loadConfigFile();
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
    const configFileContent = Deno.readTextFileSync(this.pathname);
    const config = JSON.parse(configFileContent);
    return config;
  }
}
