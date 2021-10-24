import Command from "./Command.class.ts";

export default class Restart extends Command {
  constructor(args: string[]) {
    super(args);
  }

  exec() {
    return "restart";
  }

  usage() {
    return "restart <process_name>";
  }
}
