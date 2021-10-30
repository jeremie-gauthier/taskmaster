import Command from "./Command.class.ts";
import { isEmpty } from "../utils/index.ts";
import Container from "../process/Container.class.ts";

export default class Start extends Command {
  constructor(args: string[]) {
    super(args);
  }

  async exec() {
    if (isEmpty(this.args)) {
      return this.usage();
    }

    const processResponses: (Promise<string> | string)[] = [];

    for (const arg of this.args) {
      const currentProcess = Container.getInstance().getProcess(arg);

      if (currentProcess) {
        processResponses.push(
          currentProcess.start({ commandFromUser: Command.FROM_USER }),
        );
      } else {
        processResponses.push(`${arg}: not found`);
      }
    }
    const allResponses = await Promise.all(processResponses);

    return allResponses.join("\n");
  }

  usage() {
    return [
      "start <name>\t\tStart a process",
      "start <gname>:\t\tStart all processes in a group",
      "start <name> <name>\tStart multiple processes or groups",
      "start all\t\tStart all processes",
    ].join("\n");
  }
}
