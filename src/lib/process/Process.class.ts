import type { ProcessConfig } from "../config/types.ts";
import type { ProcessStatus } from "./types.ts";

export default class Process {
  private readonly name: string;
  private _config: ProcessConfig;
  private _status: ProcessStatus = "STOPPED";
  private _startRetries = 0;
  private _handle: Deno.Process<Deno.RunOptions> | null = null;

  constructor(name: string, config: ProcessConfig) {
    this.name = name;
    this._config = config;
  }

  get config() {
    return this._config;
  }

  get status() {
    return this._status;
  }

  get handle() {
    return this._handle;
  }

  set handle(handle: Deno.Process | null) {
    this._handle = handle;
  }
}
