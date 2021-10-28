import type { ProcessConfig } from "../config/types.ts";
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
    env: {},
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
    this._handle = handle;

    if (handle) {
      this._status = "RUNNING";
      this._lastTimeEvent = new Date();
      handle.status().then(({ success, code, signal }) => {
        if (success) {
          this._status = "EXITED";
          this._lastTimeEvent = new Date();
          this._handle = null;
        }
      });
    } else {
      this._lastTimeEvent = new Date();
      this._status = "STOPPED";
    }
  }

  start() {
    if (this._status === "RUNNING") {
      return `${this.name}: ERROR (already started)`;
    }

    // format args (from config file) for Deno
    const command = this.config.cmd?.split(/\s+/) ?? [];
    const env = this.config.env
      ? [
        "env",
        ...Object.entries(this.config.env).map((entry) => entry.join("=")),
      ]
      : [];
    const cmd = [...env, ...command];
    console.log(cmd);
    this.handle = Deno.run({ cmd });

    return `${this.name}: started`;
  }
}
