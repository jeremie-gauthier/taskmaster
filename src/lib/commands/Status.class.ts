import Command from "./Command.class.ts";

export default class Status extends Command {
  constructor(args: string[]) {
    super(args);
  }

  exec() {
    return "status";
  }

  usage() {
    return "status <process_name>";
  }
}
