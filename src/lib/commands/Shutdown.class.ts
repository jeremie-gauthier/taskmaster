import Command from "./Command.class.ts";

export default class Shutdown extends Command {
  constructor(args: string[]) {
    super(args);
  }

  exec() {
    return "shutdown";
  }

  usage() {
    return "shutdown <process_name>";
  }
}
