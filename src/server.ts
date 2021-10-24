import ConfigFile from "./lib/config/ConfigFile.class.ts";
import TCPMessage from "./lib/tcp/TCPMessage.class.ts";
import TCPListener from "./lib/tcp/TCPListener.class.ts";
import matchCommand from "./lib/commands/matchCommand.ts";
import Processes from "./lib/process/Container.class.ts";
import { isNull } from "./lib/utils/index.ts";
import { getTcpPort } from "./lib/utils/envVars.ts";

const handleConn = async (TCPMsg: TCPMessage) => {
  await TCPMsg.write("Hello, client!", { canConnect: true });
  await readFromConn(TCPMsg);
  await TCPMsg.write("Goodbye !");
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

    const cmdResponse = new Command(args).exec();
    TCPMsg.write(cmdResponse);
  }
};

(async () => {
  if (Deno.args.length !== 1) {
    console.error("taskmaster usage goes here");
    return 1;
  }

  const TCP_PORT = getTcpPort();
  if (isNull(TCP_PORT)) return 1;

  const pathname = Deno.args[0];
  ConfigFile.getInstance(pathname);
  Processes.getInstance().buildFromConfigFile();

  const listener = new TCPListener(TCP_PORT);
  await listener.handleIncomingConn(handleConn);
  return 0;
})();
