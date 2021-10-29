import { ProcessConfig, Signal, SignalCode } from "../config/types.ts";
import { ellapsedTime, secondsToMillis } from "../utils/date.ts";
import type { ProcessStatus } from "./types.ts";
import { copy } from "https://deno.land/std@0.104.0/io/util.ts";

type AutoRestartCtx = {
  exitCode: Deno.ProcessStatus["code"];
  startupProcess: boolean;
};

const FILE_OPTIONS: Deno.OpenOptions = {
  create: true,
  write: true,
  append: true,
};

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
    stdout: null, // not sure of this one
    stderr: null, // not sure of this one
    env: null,
    workingDir: null,
    umask: null,
  };

  constructor(name: string, config: ProcessConfig) {
    this.name = name;
    this._config = config;
    if (config.autoStart) {
      this.start({ startupProcess: true });
    }
  }

  get config() {
    return this._config;
  }

  set config(config: ProcessConfig) {
    this._config = config;
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
    if (this.handle) {
      this.handle.close();
    }

    this._handle = handle;

    if (handle) {
      this._status = "STARTING";
      this._lastTimeEvent = new Date();
      if (this.config.stdout) {
        Deno.open(this.config.stdout, FILE_OPTIONS).then((outFile) =>
          copy(handle.stdout!, outFile)
        );
      }
      if (this.config.stderr) {
        Deno.open(this.config.stderr, FILE_OPTIONS).then((errFile) =>
          copy(handle.stderr!, errFile)
        );
      }
    } else {
      this._lastTimeEvent = new Date();
      this._status = "STOPPED";
    }
  }

  private getStartCommand() {
    const command = this.config.cmd?.split(/\s+/) ?? [];
    const directory = this.config.workingDir
      ? [
        "cd",
        this.config.workingDir,
      ]
      : null;
    const umask = this.config.umask ? ["umask", this.config.umask] : null;
    const env = this.config.env
      ? [
        "env",
        ...Object.entries(this.config.env).map((entry) => entry.join("=")),
      ]
      : [];
    const cmd = [
      ...(directory ? [...directory, "&&"] : []),
      ...(umask ? [...umask, "&&"] : []),
      ...env,
      ...command,
    ];
    return ["bash", "-c", cmd.join(" ")];
  }

  private isUnexpectedExitCode = (exitCode: number) =>
    !this.config.exitCodes.includes(exitCode);

  private waitHealthyState = () =>
    new Promise<Deno.ProcessStatus>((resolve) =>
      setTimeout(resolve, secondsToMillis(this.config.startTime), {
        success: true,
      })
    );

  private autoRestart = (
    { exitCode, startupProcess }: AutoRestartCtx,
  ): Promise<string> => {
    // console.log("AUTO RESTART::", exitCode, startupProcess);

    if (
      startupProcess &&
      (this.isUnexpectedExitCode(exitCode) || this.status === "BACKOFF")
    ) {
      return this.start({ startupProcess });
    }

    // else
    switch (this.config.autoRestart) {
      case "always":
        return this.start({});
      case "unexpected":
        if (this.isUnexpectedExitCode(exitCode)) {
          return this.start({});
        }
    }

    let exitMsg = `--> ${this.status}`;
    // default and never case are same process
    switch (this.status) {
      case "BACKOFF":
        exitMsg = "ERROR (spawn error)";
        break;
    }
    return new Promise((resolve) => resolve(exitMsg));
  };

  private onProcessExit = (
    { success, code, signal }: Deno.ProcessStatus,
    startupProcess: boolean,
  ) => {
    // console.log("HANDLE::", success, code, signal);

    this._lastTimeEvent = new Date();
    this.handle = null;
    this._status = success ? "EXITED" : "FATAL";

    if (signal) {
      return `${this.name}: stopped`;
    }

    return this.autoRestart({ exitCode: code, startupProcess });
  };

  async start(
    { commandFromUser = false, startupProcess = false },
  ): Promise<string> {
    if (["RUNNING", "STARTING"].includes(this.status)) {
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

    this.handle = Deno.run({
      cmd: this.getStartCommand(),
      stdout: this.config.stdout ? "piped" : "inherit",
      stderr: this.config.stderr ? "piped" : "inherit",
    });

    const { code: exitCode } = await Promise.race([
      this.handle.status(),
      this.waitHealthyState(),
    ]);

    const isBackOff =
      ellapsedTime(this._lastTimeEvent!) < this.config.startTime;

    if (isBackOff) {
      this._status = "BACKOFF";
      return this.autoRestart({ exitCode, startupProcess });
    }

    this.handle.status().then((processStatus) =>
      this.onProcessExit(processStatus, startupProcess)
    );

    return `${this.name}: started`;
  }

  async stop() {
    if (
      ["FATAL", "EXITED", "STOPPED"].includes(this.status) || !this.handle
    ) {
      return `${this.name}: ERROR (not running)`;
    }

    const signal: Signal = this.config.stopSignal ?? "TERM";
    const signo = SignalCode[signal];
    this.handle.kill(signo);

    const stopTimeMs = secondsToMillis(this.config.stopTime);
    // @ts-ignore Deno.signal is an experimental feature
    const sig = Deno.signal(SignalCode["CHLD"]);
    const tid = setTimeout(() => {
      sig.dispose();
      this.handle?.kill(SignalCode["KILL"]);
    }, stopTimeMs);

    for await (const _ of sig) {
      sig.dispose();
      clearTimeout(tid);
    }

    this.handle = null;
    return `${this.name}: stopped`;
  }
}
