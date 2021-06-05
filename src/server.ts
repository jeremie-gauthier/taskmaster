import TCPMessage from "./lib/tcp/TCPMessage.class.ts";
import TCPListener from "./lib/tcp/TCPListener.class.ts";
import matchCommand from "./lib/commands/matchCommand.ts";
import { TCP_PORT } from "./config.ts";

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
  const listener = new TCPListener(TCP_PORT);
  await listener.handleIncomingConn(handleConn);
})();
