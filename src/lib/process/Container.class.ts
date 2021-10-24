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
        this.add(processName, processConfig);
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
      const newConfig = ConfigFile.getInstance().config as Programs;
      const newPrograms = newConfig.programs as Programs;
      const newProgramsEntries = Object.entries(newConfig.programs as Programs);

      const oldPrograms = this.processes;
      const oldProgramsEntries = Object.entries(oldPrograms);

      // on check les anciennes valeurs pour voir lesquelles update
      for (const [oldProgName] of oldProgramsEntries) {
        const oldProgRemoved = isNone(newPrograms[oldProgName]);
        if (oldProgRemoved) {
          // stopper l'ancien prog et le supprimer de la liste
        }
      }

      for (const [newProgName, newProgConfig] of newProgramsEntries) {
        const isNewProg = isNone(oldPrograms[newProgName]);

        if (isNewProg) {
          // creer nouveau prog
          console.log(newProgName, "is a new program");
        } else {
          const oldProgConfig = oldPrograms[newProgName]?.config;
          if (this.progsDiff(newProgConfig, oldProgConfig)) {
            // rewrite the config
            console.log(newProgName, "config rewritten");
            if (this.progMustReload(newProgConfig, oldProgConfig)) {
              // restart prog here
              console.log(newProgName, "must reload");
            }
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
      this.processes[processName] = new Process(processName, processConfig);
    }
  }
}
