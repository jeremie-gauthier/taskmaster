import Container from "../process/Container.class.ts";

export default abstract class Command {
  protected args: string[] = [];

  constructor(args: string[]) {
    this.parseArgs(args);
  }

  abstract exec(): string | Promise<string>;
  abstract usage(): string;

  parseArgs(args: string[]) {
    this.args = args;

    if (args.includes("all")) {
      const Processes = Container.getInstance().processes;
      const allProcessName = Object.keys(Processes);
      this.args = allProcessName;
    }
  }
}
