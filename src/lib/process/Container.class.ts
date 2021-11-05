import Process from "./Process.class.ts";
import ConfigFile from "../config/ConfigFile.class.ts";
import { ProcessConfig, Programs } from "../config/types.ts";
import { isEmpty, isNone, isUndefined } from "../utils/index.ts";
import Logger from "../logger/Logger.class.ts";
import { quitServer } from "../utils/daemon.ts";

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

  getProcess(processName: string) {
    return this.processes[processName];
  }

  private spawnProc = (name: string, config: ProcessConfig) => {
    const { numProcs } = config;

    if (numProcs === 1) {
      this.add(name, config);
    } else {
      for (let nProc = 0; nProc < numProcs; nProc++) {
        this.add(`${name}:${name}_${nProc}`, config);
      }
    }
  };

  private procGroup = (groupName: string) =>
    Object.keys(this.processes).filter((procName) =>
      procName.startsWith(`${groupName}:`)
    );

  private stopMultipleProcs = (groupName: string) => {
    const toStop = this.procGroup(groupName);
    toStop.forEach((procName) => this.remove(procName));
  };

  async buildFromConfigFile() {
    const configFile = ConfigFile.getInstance();

    try {
      const processes = Object.entries(configFile.programs as Programs);
      for (const [processName, processConfig] of processes) {
        const processConfigWithDefaults = {
          ...Process.DEFAULT_CONFIG,
          ...processConfig,
        };

        this.spawnProc(processName, processConfigWithDefaults);
      }
    } catch (error) {
      Logger.getInstance().error(
        `Error while parsing the configuration file:\n${error.message}`,
      );
      await quitServer();
    }
  }

  private processReloading = async (
    oldProgConfig: ProcessConfig,
    newProgConfig: ProcessConfig,
    newProgName: string,
  ) => {
    const currentProcess = this.processes[newProgName];

    const oneOneProcess = (nbProcsA: number, nbProcsB: number) =>
      nbProcsA === 1 && nbProcsB === 1;

    const oneManyProcess = (nbProcsA: number, nbProcsB: number) =>
      nbProcsA === 1 && nbProcsB !== 1;

    if (
      oneOneProcess(oldProgConfig.numProcs, newProgConfig.numProcs)
    ) {
      currentProcess.stop();
      await currentProcess.start({
        commandFromUser: true,
        startupProcess: true,
      });
    } else if (
      oneManyProcess(oldProgConfig.numProcs, newProgConfig.numProcs)
    ) {
      this.remove(newProgName);
      this.spawnProc(newProgName, newProgConfig);
    } else if (
      oneManyProcess(newProgConfig.numProcs, oldProgConfig.numProcs)
    ) {
      this.stopMultipleProcs(newProgName);
      this.add(newProgName, newProgConfig);
    } else {
      this.stopMultipleProcs(newProgName);
      this.spawnProc(newProgName, newProgConfig);
    }
  };

  async reloadFromConfigFile() {
    const isPartOfAGroup = (processName: string) =>
      processName.match(/^\w+:\w+$/);

    try {
      Logger.getInstance().info(`Reloading configuration file.`);
      const newConfig = ConfigFile.getInstance().config!;
      const newPrograms = newConfig.programs;
      const newProgramsEntries = Object.entries(newConfig.programs);

      const oldPrograms = this.processes;
      const oldProgramsEntries = Object.entries(oldPrograms);

      // compare old prog name with new entries
      //  to know which ones need to be removed
      for (const [oldProgName] of oldProgramsEntries) {
        const progName = isPartOfAGroup(oldProgName)
          ? oldProgName.split(":")[0]
          : oldProgName;

        if (isNone(newPrograms[progName])) {
          this.remove(oldProgName);
        }
      }

      // compare new entries with old ones
      //  to know which ones need to be update / delete
      for (const [newProgName, newProgConfig] of newProgramsEntries) {
        const group = this.procGroup(newProgName);
        const hasGroup = !isEmpty(group);
        const isNewProg = isNone(oldPrograms[newProgName]) && !hasGroup;

        const newConfigWithDefaults = {
          ...Process.DEFAULT_CONFIG,
          ...newProgConfig,
        };

        if (isNewProg) {
          this.spawnProc(newProgName, newConfigWithDefaults);
        } else {
          let oldProgConfig = {} as ProcessConfig;

          if (hasGroup) {
            oldProgConfig = oldPrograms[group[0]]?.config;
          } else {
            oldProgConfig = oldPrograms[newProgName]?.config;
          }

          if (this.progsDiff(newConfigWithDefaults, oldProgConfig)) {
            this.patch(newProgName, newConfigWithDefaults);
            if (this.progMustReload(newConfigWithDefaults, oldProgConfig)) {
              await this.processReloading(
                oldProgConfig,
                newConfigWithDefaults,
                newProgName,
              );
            }
          }
        }
      }
    } catch (error) {
      Logger.getInstance().error(
        `Error while parsing the configuration file:\n${error.message}`,
      );
      await quitServer();
    }

    Logger.getInstance().debug(
      `New configuration loaded successfully:\n${
        JSON.stringify(this.processes, null, 4)
      }`,
    );
  }

  private progMustReload(pc1: ProcessConfig, pc2: ProcessConfig) {
    const RELOADABLE_KEYS: (keyof ProcessConfig)[] = [
      "cmd",
      "env",
      "numProcs",
      "stdout",
      "stderr",
      "umask",
      "workingDir",
    ];
    return RELOADABLE_KEYS.some((key) =>
      JSON.stringify(pc1[key]) !== JSON.stringify(pc2[key])
    );
  }

  private progsDiff(pc1: ProcessConfig, pc2: ProcessConfig) {
    return JSON.stringify(pc1) !== JSON.stringify(pc2);
  }

  private integrityCheck(processName: string, processConfig: ProcessConfig) {
    if (isUndefined(processConfig.cmd)) {
      Logger.getInstance().error(
        `Missing key [cmd] for process [${processName}]. Ignored.`,
      );
      return false;
    }
    return true;
  }

  private add(processName: string, processConfig: ProcessConfig) {
    if (this.integrityCheck(processName, processConfig)) {
      Logger.getInstance().info(
        `Adding ${processName} to the list of known programs.`,
      );
      this.processes[processName] = new Process(processName, processConfig);
    }
  }

  private patch(processName: string, newProcessConfig: ProcessConfig) {
    if (this.integrityCheck(processName, newProcessConfig)) {
      const group = this.procGroup(processName);
      const hasGroup = !isEmpty(group);

      const currentConfig = this.processes[
        hasGroup ? group[0] : processName
      ].config;

      if (hasGroup) {
        for (const proc of group) {
          this.processes[proc].config = {
            ...currentConfig,
            ...newProcessConfig,
          };
        }
      } else {
        this.processes[processName].config = {
          ...currentConfig,
          ...newProcessConfig,
        };
      }

      Logger.getInstance().info(
        `Patching the configuration of ${processName}.`,
      );
    }
  }

  private remove(processName: string) {
    const process = this.getProcess(processName);

    if (process) {
      process.stop();
      Logger.getInstance().info(
        `Removing ${processName} from the list of known programs.`,
      );
      delete this.processes[processName];
    }
  }
}
