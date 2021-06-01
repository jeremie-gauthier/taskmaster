import Command from "./Command.class.ts";

export default class Start extends Command {
  constructor() {
    super();
  }

  parseArgs() {}

  exec() {
    return "start";
  }

  usage() {
    return "start";
  }
}
