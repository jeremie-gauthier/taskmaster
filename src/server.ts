import ConfigFile from "./lib/config/ConfigFile.class.ts";
import TCPMessage from "./lib/tcp/TCPMessage.class.ts";
import TCPListener from "./lib/tcp/TCPListener.class.ts";
import matchCommand from "./lib/commands/matchCommand.ts";
import Processes from "./lib/process/Container.class.ts";
import { isNull } from "./lib/utils/index.ts";
import { getTcpPort } from "./lib/utils/envVars.ts";
import Shutdown from "./lib/commands/Shutdown.class.ts";
import Status from "./lib/commands/Status.class.ts";
import Exit from "./lib/commands/Exit.class.ts";
import { SignalCode } from "./lib/config/types.ts";
import {
  quitServer,
  reloadConfig,
  removeServerPID,
  writeServerPID,
} from "./lib/utils/daemon.ts";
import { signal } from "./lib/utils/signals.ts";

const handleConn = async (TCPMsg: TCPMessage) => {
  const StatusCommand = new Status(["all"]);
  const statusProcesses = StatusCommand.exec();
  await TCPMsg.write(statusProcesses, { canConnect: true });
  await readFromConn(TCPMsg);
};

const readFromConn = async (TCPMsg: TCPMessage) => {
  const jsonMessages = TCPMsg.iterRead();

  for await (const { msg } of jsonMessages) {
    const [cmd, ...args] = msg.split(/\s+/);

    const Command = matchCommand(cmd);
    if (!Command) {
      TCPMsg.write(`${cmd}: command not found`);
      continue;
    }

    const cmdResponse = await new Command(args).exec();
    await TCPMsg.write(cmdResponse);

    if (cmd === Exit.name.toLowerCase()) {
      return 0;
    }
    if (cmd === Shutdown.name.toLowerCase()) {
      await quitServer();
    }
  }
};

(async () => {
  if (Deno.args.length !== 1) {
    console.error("usage: taskmaterd <config>");
    return 1;
  }

  const TCP_PORT = getTcpPort();
  if (isNull(TCP_PORT)) return 1;

  writeServerPID();

  signal.once(SignalCode["INT"], quitServer);
  signal.once(SignalCode["QUIT"], quitServer);
  signal.once(SignalCode["TERM"], quitServer);

  const pathname = Deno.args[0];
  const configFile = ConfigFile.getInstance(pathname);
  await configFile.loadConfigFile();
  await Processes.getInstance().buildFromConfigFile();

  signal.on(SignalCode["HUP"], reloadConfig);

  const listener = new TCPListener(TCP_PORT);
  await listener.handleIncomingConn(handleConn);

  await removeServerPID();
  return 0;
})();
