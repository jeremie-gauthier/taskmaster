import Logger from "../logger/Logger.class.ts";
import Container from "../process/Container.class.ts";
import Process from "../process/Process.class.ts";
import { isEmpty } from "../utils/index.ts";
import { ellapsedTime } from "../utils/date.ts";
import Command from "./Command.class.ts";

export default class Status extends Command {
  private static UPTIME_FMT = (date: Date) => {
    const time = ellapsedTime(date);
    const prefix = (n: number) => n < 10 ? `0${n}` : `${n}`;
    const fmt = {
      sec: prefix(Math.floor(time % 60)),
      min: prefix(Math.floor((time / 60) % 60)),
      h: Math.floor(time / 60 / 60),
    };
    return `${fmt.h}:${fmt.min}:${fmt.sec}`;
  };

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

    const maxNameLen = Math.max(
      ...(this.getAllProcessName().map((processName) => processName.length)),
    );

    return this.args.map((arg) => {
      const currentProcess = Container.getInstance().getProcess(arg);

      if (currentProcess) {
        return this.format(currentProcess, maxNameLen);
      }

      return `${arg}: ERROR (no such process)`;
    }).join("\n");
  }

  usage() {
    return [
      "status <name>\t\tGet status for a single process",
      "status <gname>:*\tGet status for all processes in a group",
      "status <name> <name>\tGet status for multiple named processes",
      "status\t\t\tGet all process status info",
    ].join("\n");
  }
}
