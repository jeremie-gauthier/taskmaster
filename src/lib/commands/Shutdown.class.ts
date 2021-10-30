import Logger from "../logger/Logger.class.ts";
import Command from "./Command.class.ts";
import Stop from "./Stop.class.ts";

export default class Shutdown extends Command {
  constructor(args: string[]) {
    super(args);
  }

  async exec() {
    const StopCommand = new Stop(["all"]);
    await StopCommand.exec();
    Logger.getInstance().info("taskmasterd shut down.");
    return "Shut down";
  }

  usage() {
    return "shutdown\t\tShut the remote taskmasterd down.";
  }
}
