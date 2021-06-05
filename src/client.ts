import repl from "./lib/repl/index.ts";
import TCPConnecter from "./lib/tcp/TCPConnecter.class.ts";

(async () => {
  try {
    const tcp = new TCPConnecter(8080);
    await tcp.Ready;

    const TCPMsg = tcp.getTCPMsg();
    if (TCPMsg) {
      await repl(TCPMsg);
    }
  } catch (error) {
    console.log(error.message);
  }
})();
