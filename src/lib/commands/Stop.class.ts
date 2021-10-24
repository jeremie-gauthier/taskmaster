import Command from "./Command.class.ts";

export default class Stop extends Command {
  constructor(args: string[]) {
    super(args);
  }

  exec() {
    return "stop";
  }

  usage() {
    return "stop <process_name>";
  }
}
