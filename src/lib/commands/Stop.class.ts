import Command from "./Command.class.ts";
import { isEmpty } from "../utils/index.ts";
import Container from "../process/Container.class.ts";

export default class Stop extends Command {
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
