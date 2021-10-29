import Container from "../process/Container.class.ts";
import { isEmpty } from "../utils/index.ts";

export default abstract class Command {
  protected args: string[] = [];

  static FROM_USER = true;

  constructor(args: string[]) {
    this.parseArgs(args);
  }

  abstract exec(): string | Promise<string>;
  abstract usage(): string;

  protected getAllProcessName() {
    const Processes = Container.getInstance().processes;
    const allProcessName = Object.keys(Processes);
    return allProcessName;
  }

  parseArgs(args: string[]) {
    this.args = args;

    const isGroup = (arg: string) => arg.endsWith(":");

    if (args.includes("all")) {
      this.args = this.getAllProcessName();
    } else {
      const argsGroup = args.filter((arg) => isGroup(arg));
      if (isEmpty(argsGroup)) return;

      const finalArgs = args.filter((arg) => !argsGroup.includes(arg));

      const allProcessName = this.getAllProcessName();
      for (const argGroup of argsGroup) {
        const processesInGroup = allProcessName.filter((processName) =>
          processName.startsWith(argGroup)
        );

        if (isEmpty(processesInGroup)) {
          const standaloneProcess = allProcessName.find((processName) =>
            processName === argGroup.slice(0, -1)
          );
          if (standaloneProcess) {
            finalArgs.push(standaloneProcess);
          }
        } else {
          finalArgs.push(...processesInGroup);
        }
      }
      this.args = finalArgs;
    }
  }
}
