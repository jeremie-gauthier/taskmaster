import repl from "./lib/repl/index.ts";
import TCPMessage from "./lib/tcp/TCPMessage.class.ts";

(async () => {
  const conn = await Deno.connect({ port: 8080 });
  const TCPmsg = new TCPMessage(conn);

  const greetings = await TCPmsg.read();
  if (greetings) {
    console.log(greetings.msg);
  }

  await repl(TCPmsg);
})();
