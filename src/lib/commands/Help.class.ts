import Logger from "../logger/Logger.class.ts";
import { isEmpty } from "../utils/index.ts";
import Command from "./Command.class.ts";
import Exit from "./Exit.class.ts";
import Reload from "./Reload.class.ts";
import Restart from "./Restart.class.ts";
import Shutdown from "./Shutdown.class.ts";
import Start from "./Start.class.ts";
import Status from "./Status.class.ts";
import Stop from "./Stop.class.ts";

type CommandsType = Record<
  string,
  | typeof Start
  | typeof Status
  | typeof Stop
  | typeof Restart
  | typeof Reload
  | typeof Exit
  | typeof Shutdown
>;

export default class Help extends Command {
  private detailCommand: string | null;

  constructor(args: string[]) {
    super(args);
    if (isEmpty(args)) {
      this.detailCommand = null;
    } else {
      this.detailCommand = args[0];
    }
  }

  exec() {
    Logger.getInstance().info("Display processes usage.");

    const Commands: CommandsType = {
      "start": Start,
      "restart": Restart,
      "stop": Stop,
      "status": Status,
      "reload": Reload,
      "shutdown": Shutdown,
      "exit": Exit,
    };

    if (this.detailCommand) {
      if (this.detailCommand === Help.name.toLowerCase()) {
        return this.usage();
      }

      const Cmd = Commands[this.detailCommand];
      if (Cmd) {
        return new Cmd([]).usage();
      }
      return `*** No help on ${this.detailCommand}`;
    }

    return [
      "Default commands:",
      ...Object.keys(Commands).map((command) => {
        return `- ${command}`;
      }),
    ].join("\n");
  }

  usage() {
    return [
      "help\t\t\tPrint a list of available actions",
      "help <action>\t\tPrint help for <action>",
    ].join("\n");
  }
}
