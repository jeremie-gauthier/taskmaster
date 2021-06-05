import repl from "./lib/repl/index.ts";
import TCPConnecter from "./lib/tcp/TCPConnecter.class.ts";

(async () => {
  try {
    const tcp = new TCPConnecter(8080);
    await tcp.Ready;

    if (tcp.TCPMsg) {
      await repl(tcp.TCPMsg);
    }
  } catch (error) {
    console.log(error.message);
  }
})();
