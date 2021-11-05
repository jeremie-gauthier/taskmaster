import { ProcessConfig, SignalCode } from "../config/types.ts";
import { ellapsedTime, secondsToMillis } from "../utils/date.ts";
import type { ProcessStatus } from "./types.ts";
import { copy } from "https://deno.land/std@0.104.0/io/util.ts";
import Logger from "../logger/Logger.class.ts";
import { signal } from "../utils/signals.ts";

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
  readonly name: string;
  private _config: ProcessConfig;
  private _status: ProcessStatus = "STOPPED";
  private _startRetries = 0;
  private _lastTimeEvent: Date | null = null;
  private _handle: Deno.Process<Deno.RunOptions> | null = null;
  private stoppedByUser = false;

  static DEFAULT_CONFIG: Omit<ProcessConfig, "cmd"> = {
    numProcs: 1,
    autoStart: true,
    autoRestart: "unexpected",
    exitCodes: [0],
    startTime: 1,
    startRetries: 3,
    stopSignal: "TERM",
    stopTime: 10,
    stdout: null,
    stderr: null,
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

  get pid() {
    return this._handle?.pid;
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
        Deno.open(this.config.stdout, FILE_OPTIONS).then((outFile) => {
          Logger.getInstance().info(
            `Process [${this.name}] stdout redirected to ${this.config.stdout}`,
          );
          copy(handle.stdout!, outFile);
        })
          .catch((err) => {
            Logger.getInstance().error(
              `Process [${this.name}] stdout cannot be redirected (${err.message})`,
            );
          });
      }
      if (this.config.stderr) {
        Deno.open(this.config.stderr, FILE_OPTIONS).then((errFile) => {
          Logger.getInstance().info(
            `Process [${this.name}] stderr redirected to ${this.config.stderr}`,
          );
          copy(handle.stderr!, errFile);
        })
          .catch((err) => {
            Logger.getInstance().error(
              `Process [${this.name}] stderr cannot be redirected (${err.message})`,
            );
          });
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
        return new Promise((resolve) => resolve(`${this.name}: started`));
    }

    Logger.getInstance().error(
      `Process [${this.name}] cannot retry due to "never" option in configuration file`,
    );
    let exitMsg = `${this.status}`;
    // default and never case are same process
    switch (this.status) {
      case "BACKOFF":
        exitMsg = "ERROR (spawn error)";
        break;
    }
    return new Promise((resolve) => resolve(exitMsg));
  };

  private onProcessExit = (
    { code, signal }: Deno.ProcessStatus,
    startupProcess: boolean,
  ) => {
    this._lastTimeEvent = new Date();
    this.handle = null;
    if (this.config.exitCodes.includes(code)) {
      this._status = "EXITED";
    } else {
      this._status = "FATAL";
    }

    Logger.getInstance().info(
      `Process [${this.name}] exited (code: ${code}).`,
    );

    if (signal) {
      const sigName = signal >= 1 ? Object.keys(SignalCode)[signal - 1] : null;

      Logger.getInstance().info(
        `Process [${this.name}] received signal ${sigName ?? signal}.`,
      );
    }

    if (this.stoppedByUser) {
      this.stoppedByUser = false;
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
      Logger.getInstance().error(
        `Process [${this.name}] too many retries. Stop retrying.`,
      );
      return `${this.name}: ERROR (spawn error)`;
    }

    Logger.getInstance().info(`Starting process [${this.name}]...`);
    this.handle = Deno.run({
      cmd: this.getStartCommand(),
      stdout: this.config.stdout ? "piped" : "null",
      stderr: this.config.stderr ? "piped" : "null",
    });

    const { code: exitCode } = await Promise.race([
      this.handle.status(),
      this.waitHealthyState(),
    ]);

    const isBackOff =
      ellapsedTime(this._lastTimeEvent!) < this.config.startTime;

    if (isBackOff) {
      this._status = "BACKOFF";
      this._handle = null;
      Logger.getInstance().info(`Process [${this.name}] exited too soon`);
      return this.autoRestart({ exitCode, startupProcess });
    }

    this._status = "RUNNING";
    this.handle.status().then((processStatus) =>
      this.onProcessExit(processStatus, startupProcess)
    );

    Logger.getInstance().info(`Process [${this.name}] started.`);
    return `${this.name}: started`;
  }

  async stop() {
    if (
      ["FATAL", "EXITED", "STOPPED"].includes(this.status) || !this.handle
    ) {
      return `${this.name}: ERROR (not running)`;
    }
    this.stoppedByUser = true;

    Logger.getInstance().info(`Stopping [${this.name}]...`);

    const stopTimeMs = secondsToMillis(this.config.stopTime);

    // @ts-ignore Deno.signal is an experimental feature
    const sigChild = SignalCode["CHLD"];

    // if SIGCHLD not receive in the meanwhile, then force kill subprocess
    const tid = setTimeout(() => {
      Logger.getInstance().info(
        `Process [${this.name}] failed to quit with SIG${this.config
          .stopSignal ??
          "TERM"}. Sending SIGKILL...`,
      );
      this.handle?.kill(SignalCode["KILL"]);
      this.handle = null;
    }, stopTimeMs);

    // Send the stop signal to the subprocess, it should respond with a SIGCHLD
    const signo = SignalCode[this.config.stopSignal ?? "TERM"];
    try {
      this.handle.kill(signo);
    } catch (_error) {
      try {
        if (signo !== SignalCode["TERM"]) {
          this.handle.kill(SignalCode["TERM"]);
        }
      } catch (_error) {
        return `${this.name}: ERROR (not running)`;
      }
    }

    // await for the SIGCHLD signal to be received
    await signal.once(sigChild, () => {
      Logger.getInstance().info(
        `Process [${this.name}] stopped with SIG${this.config.stopSignal ??
          "TERM"}.`,
      );
      this.handle = null;
      clearTimeout(tid);
    });

    Logger.getInstance().info(`Process [${this.name}] stopped by user.`);
    return `${this.name}: stopped`;
  }
}
