import type { ProcessConfig } from "../config/types.ts";
import { ellapsedTime, secondsToMillis } from "../utils/date.ts";
import type { ProcessStatus } from "./types.ts";

export default class Process {
  private readonly name: string;
  private _config: ProcessConfig;
  private _status: ProcessStatus = "STOPPED";
  private _startRetries = 0;
  private _lastTimeEvent: Date | null = null;
  private _handle: Deno.Process<Deno.RunOptions> | null = null;

  static DEFAULT_CONFIG: Omit<ProcessConfig, "cmd"> = {
    numProcs: 1,
    autoStart: true,
    autoRestart: "unexpected",
    exitCodes: [0],
    startTime: 1,
    startRetries: 3,
    stopSignal: "TERM",
    stopTime: 10,
    stdout: "/dev/stdout", // not sure of this one
    stderr: "/dev/stder", // not sure of this one
    env: null,
    workingDir: null,
    umask: null,
  };

  constructor(name: string, config: ProcessConfig) {
    this.name = name;
    this._config = config;
    if (config.autoStart) {
      this.start();
    }
  }

  get config() {
    return this._config;
  }

  get status() {
    return this._status;
  }

  get lastTimeEvent() {
    return this._lastTimeEvent;
  }

  get handle() {
    return this._handle;
  }

  set handle(handle: Deno.Process | null) {
    if (this._handle) {
      this._handle.close();
    }

    this._handle = handle;

    if (handle) {
      this._status = "STARTING";
      this._lastTimeEvent = new Date();
    } else {
      this._lastTimeEvent = new Date();
      this._status = "STOPPED";
    }
  }

  // format args (from config file) for Deno
  getStartCommand() {
    const command = this.config.cmd?.split(/\s+/) ?? [];
    const directory = this.config.workingDir
      ? [
        "cd",
        this.config.workingDir,
      ]
      : null;
    const env = this.config.env
      ? [
        "env",
        ...Object.entries(this.config.env).map((entry) => entry.join("=")),
      ]
      : [];
    const cmd = [
      ...(directory ? [...directory, "&&"] : []),
      ...env,
      ...command,
    ];
    return ["bash", "-c", cmd.join(" ")];
  }

  waitHealthyState = () =>
    new Promise<Deno.ProcessStatus>((resolve) =>
      setTimeout(resolve, secondsToMillis(this.config.startTime), {
        success: true,
      })
    );

  async start(commandFromUser = false): Promise<string> {
    if (this._status === "RUNNING" || this._status === "STARTING") {
      return `${this.name}: ERROR (already started)`;
    }

    if (commandFromUser) {
      this._startRetries = 0;
    } else {
      this._startRetries += 1;
    }

    const canRetry = this._startRetries <= this.config.startRetries;
    if (!canRetry) {
      this._status = "FATAL";
      return `${this.name}: ERROR (spawn error)`;
    }

    this.handle = Deno.run({ cmd: this.getStartCommand() });

    const r = await Promise.race([
      this.handle.status(),
      this.waitHealthyState(),
    ]);

    const isBackOff =
      ellapsedTime(this._lastTimeEvent!) < this.config.startTime;

    if (isBackOff) {
      console.log("is back offj");
      this._status = "BACKOFF";
      return this.start();
    }

    const { success, code, signal } = await this.handle.status();

    this._lastTimeEvent = new Date();
    this._handle = null;

    if (success) {
      this._status = "EXITED";
    }

    return `${this.name}: started`;
  }
}
