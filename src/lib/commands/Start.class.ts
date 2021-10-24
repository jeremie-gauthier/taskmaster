import Command from "./Command.class.ts";
import Container from "../process/Container.class.ts";
import { isEmpty } from "../utils/index.ts";

export default class Start extends Command {
  constructor(args: string[]) {
    super(args);
  }

  exec() {
    if (isEmpty(this.args)) {
      return this.usage();
    }

    const Processes = Container.getInstance().processes;
    const processResponses: string[] = [];

    for (const arg of this.args) {
      const currentProcess = Processes[arg];
      if (!currentProcess) {
        processResponses.push(`${arg}: not found`);
      }

      // format args (from config file) for Deno
      const cmd = currentProcess.config.cmd?.split(/\s+/) ?? [];
      const handle = Deno.run({ cmd });

      // bind the subprocess handler for later calls
      currentProcess.handle = handle;
      processResponses.push(`${arg}: started`);
    }
    return processResponses.join("\n");
  }

  usage() {
    return "start <process_name>";
  }
}
