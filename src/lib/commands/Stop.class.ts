import Command from "./Command.class.ts";
import Processes from "../process/Container.class.ts";
import { isEmpty } from "../utils/index.ts";

export default class Stop extends Command {
  constructor(args: string[]) {
    super(args);
  }

  async exec() {
    if (isEmpty(this.args)) {
      return this.usage();
    }

    const processes = Processes.getInstance().processes;
    const processResponses: (Promise<string> | string)[] = [];

    for (const arg of this.args) {
      const currentProcess = processes[arg];

      if (currentProcess) {
        processResponses.push(currentProcess.stop());
      } else {
        processResponses.push(`${arg}: not found`);
      }
    }
    const allResponses = await Promise.all(processResponses);

    return allResponses.join("\n");
  }

  usage() {
    return "stop <process_name>";
  }
}
