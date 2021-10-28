import Process from "./Process.class.ts";
import ConfigFile from "../config/ConfigFile.class.ts";
import { ProcessConfig, Programs } from "../config/types.ts";
import { isNone, isUndefined } from "../utils/index.ts";

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
      const processes = Object.entries(configFile.programs as Programs);
      for (const [processName, processConfig] of processes) {
        const processConfigWithDefaults = {
          ...Process.DEFAULT_CONFIG,
          ...processConfig,
        };

        const { numProcs } = processConfigWithDefaults;

        if (numProcs === 1) {
          this.add(processName, processConfigWithDefaults);
        } else {
          for (let nProc = 0; nProc < numProcs; nProc++) {
            this.add(`${processName}_${nProc}`, processConfigWithDefaults);
          }
        }
      }
    } catch (error) {
      console.error(`[-] Error while building processes (${error})`);
    }

    console.log(
      `[*] Processes sucessfully built from config file:\n${
        JSON.stringify(this.processes, null, 4)
      }`,
    );
  }

  reloadFromConfigFile() {
    // TODO: take logFile into account
    // TODO: tester en supprimant le fichier
    // TODO: tester en supprimant le contenu du fichier

    try {
      const newConfig = ConfigFile.getInstance().config!;
      const newPrograms = newConfig.programs;
      const newProgramsEntries = Object.entries(newConfig.programs);

      const oldPrograms = this.processes;
      const oldProgramsEntries = Object.entries(oldPrograms);

      // compare old prog name with new entries
      //  to know which ones need to be removed
      for (const [oldProgName] of oldProgramsEntries) {
        if (isNone(newPrograms[oldProgName])) {
          this.remove(oldProgName);
        }
      }

      // compare new entries with old ones
      //  to know which ones need to be update / delete
      for (const [newProgName, newProgConfig] of newProgramsEntries) {
        const isNewProg = isNone(oldPrograms[newProgName]);

        if (isNewProg) {
          this.add(newProgName, newProgConfig);
        } else {
          const oldProgConfig = oldPrograms[newProgName]?.config;
          if (this.progsDiff(newProgConfig, oldProgConfig)) {
            // update the config without restarting prog
            console.log(newProgName, "config rewritten");
            if (this.progMustReload(newProgConfig, oldProgConfig)) {
              // restart prog here
              console.log(newProgName, "must reload");
            }
          }
        }
      }

      console.log(ConfigFile.getInstance().config?.programs);
    } catch (error) {
      console.error(`[-] Error while building processes (${error})`);
    }

    console.log(
      `[*] Processes sucessfully built from config file:\n${
        JSON.stringify(this.processes, null, 4)
      }`,
    );
  }

  private progMustReload(pc1: ProcessConfig, pc2: ProcessConfig) {
    // TODO: complete RELOADABLE_KEYS
    const RELOADABLE_KEYS: (keyof ProcessConfig)[] = ["cmd", "env"];
    return RELOADABLE_KEYS.some((key) => pc1[key] !== pc2[key]);
  }

  private progsDiff(pc1: ProcessConfig, pc2: ProcessConfig) {
    return JSON.stringify(pc1) !== JSON.stringify(pc2);
  }

  private integrityCheck(processName: string, processConfig: ProcessConfig) {
    // no need to check for duplicate keys, this is done natively in JSON

    if (isUndefined(processConfig.cmd)) {
      console.error(
        `[-] Missing key [cmd] for process [${processName}]. Ignored.`,
      );
      return false;
    }
    return true;
  }

  add(processName: string, processConfig: ProcessConfig) {
    if (this.integrityCheck(processName, processConfig)) {
      console.log(`[+] ADD: ${processName} to the list of programs`);
      this.processes[processName] = new Process(processName, processConfig);
    }
  }

  remove(processName: string) {
    const process = this.processes[processName];
    if (process) {
      // process.stop()
      console.log(`[+] REMOVE: ${processName} from the list of programs`);
      delete this.processes[processName];
    }
  }
}
