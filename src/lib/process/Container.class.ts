import Process from "./Process.class.ts";
import ConfigFile from "../config/ConfigFile.class.ts";
import { ProcessConfig } from "../config/types.ts";
import { isUndefined } from "../utils/index.ts";

export type ProcessList = {
  [processName: string]: ProcessConfig;
};

export default class Container {
  private _processes: Record<string, Process>;

  private static instance: Container;

  private constructor() {
    this._processes = {};
  }

  get processes() {
    return this._processes;
  }

  static getInstance() {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  buildFromConfigFile() {
    const configFile = ConfigFile.getInstance();

    try {
      const processes = configFile.programs;
      const itProcesses = Object.entries(processes);
      itProcesses.forEach(([processName, processConfig]) => {
        this.add(processName, processConfig);
      });
    } catch (error) {
      console.error(`[-] Error while building processes (${error})`);
    }

    console.log(
      `[*] Processes sucessfully built from config file:\n${
        JSON.stringify(this.processes, null, 4)
      }`,
    );
  }

  private integrityCheck(processName: string, processConfig: ProcessConfig) {
    // no need to check for duplicate keys, this is done natively in JSON

    if (isUndefined(processConfig.cmd)) {
      console.error(
        `[-] Missing key [command] for process [${processName}]. Ignored.`,
      );
      return false;
    }

    return true;
  }

  add(processName: string, processConfig: ProcessConfig) {
    if (this.integrityCheck(processName, processConfig)) {
      this.processes[processName] = new Process(processName, processConfig);
    }
  }
}
