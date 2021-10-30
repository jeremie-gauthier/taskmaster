import Container from "../process/Container.class.ts";
import { isEmpty } from "../utils/index.ts";
import Command from "./Command.class.ts";

export default class Restart extends Command {
  constructor(args: string[]) {
    super(args);
  }

  async exec() {
    if (isEmpty(this.args)) {
      return this.usage();
    }

    const allResponses: string[] = [];
    for (const arg of this.args) {
      const currentProcess = Container.getInstance().getProcess(arg);

      const stopRes = await currentProcess.stop();
      allResponses.push(stopRes);

      const startRes = await currentProcess.start({ commandFromUser: true });
      allResponses.push(startRes);
    }
    return allResponses.join("\n");
  }

  usage() {
    return [
      "restart <name>\t\tRestart a process",
      "restart <gname>:\tRestart all processes in a group",
      "restart <name> <name>\tRestart multiple processes or groups",
      "restart all\t\tRestart all processes",
    ].join("\n");
  }
}
