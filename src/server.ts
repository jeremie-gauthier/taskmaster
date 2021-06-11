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

  for await (const { msg, payload } of jsonMessages) {
    // exec cmd
    console.log("received", msg, payload);
    const cmd = matchCommand(msg);
    console.log(cmd);

    if (msg === "exit") {
      return;
    }
    TCPMsg.write(`You sent me: ${msg}`);
  }
};

(async () => {
  if (Deno.args.length !== 1) {
    console.error("taskmaster usage goes here");
    return 1;
  }

  const TCP_PORT = getTcpPort();
  if (isNull(TCP_PORT)) return 1;

  const pathname = Deno.args[1];
  ConfigFile.getInstance(pathname);
  Processes.getInstance().buildFromConfigFile();

  const listener = new TCPListener(TCP_PORT);
  await listener.handleIncomingConn(handleConn);
  return 0;
})();
