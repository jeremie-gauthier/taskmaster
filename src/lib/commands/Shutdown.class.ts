import Command from "./Command.class.ts";
import Stop from "./Stop.class.ts";

export default class Shutdown extends Command {
  constructor(args: string[]) {
    super(args);
  }

  async exec() {
    const StopCommand = new Stop(["all"]);
    await StopCommand.exec();
    return "Shut down";
  }

  usage() {
    return "Shut the remote taskmasterd down.";
  }
}
