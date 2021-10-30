import Command from "./Command.class.ts";
import { isEmpty } from "../utils/index.ts";
import Container from "../process/Container.class.ts";

export default class Stop extends Command {
  constructor(args: string[]) {
    super(args);
  }

  exec() {
    if (isEmpty(this.args)) {
      return this.usage();
    }

    const processResponses: (Promise<string> | string)[] = [];

    for (const arg of this.args) {
      const currentProcess = Container.getInstance().getProcess(arg);

      if (currentProcess) {
        processResponses.push(currentProcess.stop());
      } else {
        processResponses.push(`${arg}: not found`);
      }
    }

    return processResponses.join("\n");
  }

  usage() {
    return [
      "stop <name>\t\tStop a process",
      "stop <gname>:*\t\tStop all processes in a group",
      "stop <name> <name>\tStop multiple processes or groups",
      "stop all\t\tStop all processes",
    ].join("\n");
  }
}
