import Logger from "../logger/Logger.class.ts";
import TCPMessage from "./TCPMessage.class.ts";

type TCPListenerOptions = {
  maxConn: number;
};

type OnConnectCallback = (TCPMsg: TCPMessage) => Promise<void>;

export default class TCPListener {
  private connections: Record<number, { conn: Deno.Conn; TCPMsg: TCPMessage }>;
  private options = {
    maxConn: 5,
  };
  private listener: Deno.Listener;

  constructor(port: number, options?: Partial<TCPListenerOptions>) {
    this.options = { ...this.options, ...options };
    this.listener = Deno.listen({ port });
    this.connections = {};
    console.info(`[*] Listening on 0.0.0.0:${port}`);
  }

  private get activeConns() {
    return Object.entries(this.connections).length;
  }

  private canConnect = () => this.activeConns < this.options.maxConn;

  private addConn = (conn: Deno.Conn, TCPMsg: TCPMessage) => {
    this.connections[conn.rid] = { conn, TCPMsg };
  };

  private removeConn = (conn: Deno.Conn) => {
    conn.close();
    delete this.connections[conn.rid];
  };

  async handleIncomingConn(onConnect: OnConnectCallback) {
    for await (const conn of this.listener) {
      const TCPMsg = new TCPMessage(conn);
      this.addConn(conn, TCPMsg);
      Logger.getInstance().info(`Incoming connection (id: ${conn.rid}).`);

      // using `then` instead of `async` here for non-blocking thread
      // else it would stuck and block other connections
      if (this.canConnect()) {
        Logger.getInstance().info(`Connection (id: ${conn.rid}) allowed.`);
        onConnect(TCPMsg)
          .then(() => this.removeConn(conn));
      } else {
        Logger.getInstance().error(
          `Connection (id: ${conn.rid}) rejected (No space left).`,
        );
        TCPMsg.write(
          "[-] Cannot connect to taskmaster daemon (No space left)",
          { canConnect: false },
        )
          .then(() => this.removeConn(conn));
      }
    }
  }

  async closeAll() {
    const conns = Object.values(this.connections);
    const promiseRmConns = conns.map(async ({ conn, TCPMsg }) => {
      await TCPMsg.write("[*] Daemon has exitted", { connected: false });
      this.removeConn(conn);
    });
    await Promise.all(promiseRmConns);
  }
}
