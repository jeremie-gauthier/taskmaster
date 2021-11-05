import Stop from "../commands/Stop.class.ts";
import ConfigFile from "../config/ConfigFile.class.ts";
import Logger from "../logger/Logger.class.ts";
import Processes from "../process/Container.class.ts";
import TCPListener from "../tcp/TCPListener.class.ts";

const PID_FILE = "./taskmasterd.pid";

export const writeServerPID = () => {
  try {
    const Encoder = new TextEncoder();
    return Deno.writeFile(PID_FILE, Encoder.encode(`${Deno.pid}`));
  } catch (_error) {
    return null;
  }
};

export const removeServerPID = () => {
  try {
    return Deno.remove(PID_FILE);
  } catch (_error) {
    return null;
  }
};

export const quitServer = async () => {
  const listener = TCPListener.getInstance();
  const StopCommand = new Stop(["all"]);
  await Promise.all([
    StopCommand.exec(),
    removeServerPID(),
    listener.closeAll(),
  ]);
  Logger.close();
  Deno.exit(0);
};

export const reloadConfig = async () => {
  await ConfigFile.getInstance().loadConfigFile();
  await Processes.getInstance().reloadFromConfigFile();
};
