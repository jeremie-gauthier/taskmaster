import Logger from "../logger/Logger.class.ts";
import Command from "./Command.class.ts";

export default class Exit extends Command {
  constructor(args: string[]) {
    super(args);
  }

  exec() {
    Logger.getInstance().info("User exits taskmasterctl.");
    return "\n";
  }

  usage() {
    return "exit\t\t\tExit the taskmaster shell.";
  }
}
