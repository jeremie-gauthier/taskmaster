import Command from "./Command.class.ts";
import Container from "../process/Container.class.ts";

export default class Start extends Command {
  private args: string[];

  constructor(args: string[]) {
    super();
    this.args = args;
    return this;
  }

  parseArgs() {}

  exec() {
    const Processes = Container.getInstance().processes;
    const [processName] = this.args;
    const process = Processes[processName];
    if (!process) {
      return "Le process n'existe pas";
    }
    const cmd = process.config.cmd?.split(/\s+/) ?? [];
    const handle = Deno.run({ cmd });
    process.handle = handle;
    // console.log(Container.getInstance().processes[this.args[0]]);
    return `${processName}: started`;
  }

  usage() {
    return "start";
  }
}
