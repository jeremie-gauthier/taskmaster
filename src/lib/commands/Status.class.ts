import Logger from "../logger/Logger.class.ts";
import Container from "../process/Container.class.ts";
import Process from "../process/Process.class.ts";
import { isEmpty } from "../utils/index.ts";
import Command from "./Command.class.ts";

export default class Status extends Command {
  private static UPTIME_FMT = Intl.DateTimeFormat("fr", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format;

  private static STOP_TIME_FMT = Intl.DateTimeFormat("fr", {
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format;

  private PAD_NAME = 20;

  constructor(args: string[]) {
    super(args);
    this.preProcessing(args);
  }

  private preProcessing(args: string[]) {
    if (isEmpty(args)) {
      this.args = this.getAllProcessName();
    }
  }

  private format(
    { name, status, pid, lastTimeEvent }: Process,
    maxNameLen: number,
  ) {
    const padNameValue = maxNameLen - name.length + this.PAD_NAME;
    const padName = " ".repeat(padNameValue);

    if (["RUNNING", "STARTING"].includes(status)) {
      return `${name}${padName}${status}\t\tpid ${pid}, uptime ${
        lastTimeEvent ? Status.UPTIME_FMT(lastTimeEvent) : "unknown"
      }`;
    }

    return `${name}${padName}${status}\t\t${
      lastTimeEvent ? Status.STOP_TIME_FMT(lastTimeEvent) : "unknown"
    }`;
  }

  exec() {
    Logger.getInstance().info("Get processes status");

    const processes = Container.getInstance().processes;
    const maxNameLen = Math.max(
      ...(this.getAllProcessName().map((processName) => processName.length)),
    );

    return this.args.map((arg) => {
      const currentProcess = processes[arg];

      if (currentProcess) {
        return this.format(currentProcess, maxNameLen);
      }

      return `${arg}: ERROR (no such process)`;
    }).join("\n");
  }

  usage() {
    return "status <process_name>";
  }
}
