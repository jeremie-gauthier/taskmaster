// unexpected: if exit code is not in ProcessConfig.exitcode list,
//  then it's unexpected
export type AutoRestart = "always" | "never" | "unexpected";

export type Signal =
  | "HUP"
  | "INT"
  | "QUIT"
  | "ILL"
  | "ABRT"
  | "FPE"
  | "KILL"
  | "SEGV"
  | "PIPE"
  | "ALRM"
  | "TERM"
  | "USR1"
  | "USR2"
  | "CHLD"
  | "STOP"
  | "STP"
  | "TTIN"
  | "TTOU"
  | "VTALRM"
  | "XCPU"
  | "XFSZ"
  | "WINCH";

export type EnvVars = Record<string, string>;

export type ProcessConfig = Partial<{
  cmd: string;
  numProcs: number;
  umask: string;
  workingDir: string;
  autoStart: boolean;
  autoRestart: AutoRestart;
  exitCode: number[];
  startRetries: number;
  startTime: number;
  stopSignal: Signal;
  stopTime: number;
  stdout: string;
  stderr: string;
  env: EnvVars;
}>;

export type Configuration = {
  logFile: string;
  programs: Record<string, ProcessConfig>[];
};
