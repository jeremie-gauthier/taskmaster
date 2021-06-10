import repl from "./lib/repl/index.ts";
import TCPConnecter from "./lib/tcp/TCPConnecter.class.ts";
import { TCP_PORT } from "./config.ts";

(async () => {
  try {
    const tcp = new TCPConnecter(TCP_PORT);
    await tcp.Ready;

    if (tcp.TCPMsg) {
      await repl(tcp.TCPMsg);
    }
  } catch (error) {
    console.log(error.message);
  }
})();
