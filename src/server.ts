import TCPMessage from "./lib/tcp/TCPMessage.class.ts";

const handleConn = async (conn: Deno.Conn) => {
  const TCPMsg = new TCPMessage(conn);
  await TCPMsg.write("Hello, client!");
  await readFromConn(TCPMsg);
  conn.close();
};

const readFromConn = async (TCPMsg: TCPMessage) => {
  let read = true;

  while (read) {
    const input = await TCPMsg.read();
    if (input) {
      // exec cmd

      if (input === "exit") {
        read = false;
        await TCPMsg.write("Goodbye !");
        continue;
      }
      TCPMsg.write(`You sent me: ${input}`);
    }
  }
};

const listener = Deno.listen({ port: 8080 });

console.log("listening on 0.0.0.0:8080");

for await (const conn of listener) {
  handleConn(conn);
}
