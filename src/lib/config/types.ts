// unexpected: if exit code is not in ProcessConfig.exitcode list,
//  then it's unexpected
export type AutoRestart = "always" | "never" | "unexpected";

export enum SignalCode {
  HUP = 1,
  INT = 2,
  QUIT = 3,
  ILL = 4,
  TRAP = 5,
  ABRT = 6,
  EMT = 7,
  FPE = 8,
  KILL = 9,
  BUS = 10,
  SEGV = 11,
  SYS = 12,
  PIPE = 13,
  ALRM = 14,
  TERM = 15,
  URG = 16,
  STOP = 17,
  TSTP = 18,
  CONT = 19,
  CHLD = 20,
  TTIN = 21,
  TTOU = 22,
  IO = 23,
  XCPU = 24,
  XFSZ = 25,
  VTALRM = 26,
  PROF = 27,
  WINCH = 28,
  INFO = 29,
  USR1 = 30,
  USR2 = 31,
}

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
  env: EnvVars | null; // env vars to set before prog start
  workingDir: string | null; // working dir to set before prog start
  umask: string | null; // umask to set before prog start
};

export type FileConfig = Partial<ProcessConfig>;

export type Programs = Record<string, ProcessConfig>;

export type Configuration = {
  logFile: string;
  programs: Programs;
};
