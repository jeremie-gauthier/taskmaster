import { ProcessConfig } from "../config/types.ts";

export type ProcessList = {
  [processName: string]: ProcessConfig;
};

export default class Logger {
  private _logFile: Deno.File;
  private static Encoder = new TextEncoder();

  private static instance: Logger;

  private constructor(logFile: string) {
    this._logFile = Deno.openSync(logFile, {
      create: true,
      write: true,
      append: true,
    });
    this.info("Log file opened. Ready to register events.");
  }

  static getInstance(logFile?: string) {
    if (!Logger.instance) {
      if (!logFile) {
        throw Error("[-] A log file is required to monitor events.");
      }
      Logger.instance = new Logger(logFile);
    }

    return Logger.instance;
  }

  async open(logFile: string) {
    if (this._logFile) {
      await this.info("Detected a log file path change. Closing...");
      this._logFile.close();
    }
    this._logFile = await Deno.open(logFile, {
      create: true,
      write: true,
      append: true,
    });
    await this.info("Log file opened. Ready to register events.");
  }

  private static getTime() {
    const d = new Date();
    const prefix = (n: number) => n < 10 ? `0${n}` : `${n}`;
    const fmt = {
      day: prefix(d.getDate()),
      month: prefix(d.getMonth()),
      year: prefix(d.getFullYear()),
      hour: prefix(d.getHours()),
      min: prefix(d.getMinutes()),
      sec: prefix(d.getSeconds()),
    };
    return `${fmt.day}/${fmt.month}/${fmt.year}-${fmt.hour}:${fmt.min}:${fmt.sec}`;
  }

  private write(msg: string) {
    if (!this._logFile) return;

    const encodedMsg = Logger.Encoder.encode(`[${Logger.getTime()}] ${msg}\n`);
    this._logFile.write(encodedMsg);
  }

  log(msg: string) {
    return this.write(`[ LOG ] - ${msg}`);
  }

  info(msg: string) {
    return this.write(`[ INFO ] - ${msg}`);
  }

  error(msg: string) {
    return this.write(`[ ERROR ] - ${msg}`);
  }

  close() {
    this._logFile.close();
  }
}
