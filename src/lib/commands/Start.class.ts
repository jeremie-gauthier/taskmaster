import Command from "./Command.class.ts";
import Processes from "../process/Container.class.ts";
import { isEmpty } from "../utils/index.ts";

export default class Start extends Command {
  constructor(args: string[]) {
    super(args);
  }

  exec() {
    if (isEmpty(this.args)) {
      return this.usage();
    }

    const processes = Processes.getInstance().processes;
    const processResponses: string[] = [];

    for (const arg of this.args) {
      const currentProcess = processes[arg];

      if (currentProcess) {
        processResponses.push(currentProcess.start());
      } else {
        processResponses.push(`${arg}: not found`);
      }
    }
    return processResponses.join("\n");
  }

  usage() {
    return "start <process_name>";
  }
}
