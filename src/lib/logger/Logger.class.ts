import { ProcessConfig } from "../config/types.ts";

export type ProcessList = {
  [processName: string]: ProcessConfig;
};

export default class Logger {
  private _logFile: Deno.File;
  private static Encoder = new TextEncoder();

  private static instance: Logger;

  private static TimeFormat = new Intl.DateTimeFormat("fr", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format;

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

  static async open(logFile: string) {
    const logger = Logger.getInstance();
    if (logger._logFile) {
      await logger.info("Detected a log file path change. Closing...");
      logger._logFile.close();
    }
    logger._logFile = await Deno.open(logFile, {
      create: true,
      write: true,
      append: true,
    });
    await logger.info("Log file opened. Ready to register events.");
  }

  private write(msg: string) {
    if (!this._logFile) return;

    const date = Logger.TimeFormat(new Date());
    const encodedMsg = Logger.Encoder.encode(`[${date}] ${msg}\n`);
    return this._logFile.write(encodedMsg);
  }

  log(msg: string) {
    return this.write(`[ LOG ] - ${msg}`);
  }

  info(msg: string) {
    return this.write(`[ INFO ] - ${msg}`);
  }

  debug(msg: string) {
    return this.write(`[ DEBUG ] - ${msg}`);
  }

  error(msg: string) {
    return this.write(`[ ERROR ] - ${msg}`);
  }

  static close() {
    const logger = Logger.getInstance();
    logger._logFile.close();
  }
}
