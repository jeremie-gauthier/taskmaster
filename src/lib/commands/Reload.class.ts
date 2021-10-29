import ConfigFile from "../config/ConfigFile.class.ts";
import Processes from "../process/Container.class.ts";
import Command from "./Command.class.ts";

export default class Reload extends Command {
  constructor(args: string[]) {
    super(args);
  }

  async exec() {
    await ConfigFile.getInstance().loadConfigFile();
    await Processes.getInstance().reloadFromConfigFile();
    return "Restarted taskmasterd";
  }

  usage() {
    return "reload\t\tRestart the remote taskmasterd.";
  }
}
