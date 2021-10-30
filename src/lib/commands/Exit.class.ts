import Command from "./Command.class.ts";

export default class Exit extends Command {
  constructor(args: string[]) {
    super(args);
  }

  exec() {
    return "\n";
  }

  usage() {
    return "exit\t\t\tExit the taskmaster shell.";
  }
}
