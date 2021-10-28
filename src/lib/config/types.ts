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

export type ProcessConfig = {
  cmd: string; // command to start prog
  numProcs: number; // nb of process to start
  autoStart: boolean; // start at daemon boot or not
  autoRestart: AutoRestart; // when to restart the prog
  exitCodes: number[]; // exit code that represent an expected output
  startTime: number; // time to wait after start to consider the prog healthy
  startRetries: number; // nb of retries to do before definitive stop
  stopSignal: Signal; // signal use to gracefully exit prog
  stopTime: number; // time to wait after stop to kill the prog
  stdout: string; // where to redirect stdout
  stderr: string; // where to redirect stderr
  env: EnvVars; // env vars to set before prog start
  workingDir: string | null; // working dir to set before prog start
  umask: string | null; // umask to set before prog start
};

export type FileConfig = Partial<ProcessConfig>;

export type Programs = Record<string, ProcessConfig>;

export type Configuration = {
  logFile: string;
  programs: Programs;
};
