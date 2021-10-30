import repl from "./lib/repl/index.ts";
import TCPConnecter from "./lib/tcp/TCPConnecter.class.ts";
import { getTcpPort } from "./lib/utils/envVars.ts";
import { isNull } from "./lib/utils/index.ts";

(async () => {
  try {
    const TCP_PORT = getTcpPort();
    if (isNull(TCP_PORT)) return 1;

    const tcp = new TCPConnecter(TCP_PORT);
    await tcp.Ready;

    if (tcp.TCPMsg) {
      await repl(tcp.TCPMsg);
    }
    return 0;
  } catch (error) {
    console.log(error.message);
    return 1;
  }
})();
