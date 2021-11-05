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

  private static instance: TCPListener;

  private constructor(port: number, options?: Partial<TCPListenerOptions>) {
    this.options = { ...this.options, ...options };
    this.listener = Deno.listen({ port });
    this.connections = {};
    console.info(`[*] Listening on 0.0.0.0:${port}`);
  }

  static getInstance(port?: number, options?: Partial<TCPListenerOptions>) {
    if (!TCPListener.instance) {
      if (!port) {
        throw Error("[-] A port is required to start listening.");
      }
      TCPListener.instance = new TCPListener(port, options);
    }
    return TCPListener.instance;
  }

  private get activeConns() {
    return Object.entries(this.connections).length;
  }

  private canConnect = () => this.activeConns < this.options.maxConn;

  private addConn = (conn: Deno.Conn, TCPMsg: TCPMessage) => {
    this.connections[conn.rid] = { conn, TCPMsg };
  };

  private removeConn = (conn: Deno.Conn) => {
    try {
      conn.close();
      delete this.connections[conn.rid];
    } catch (_error) {
      // ignore;
    }
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
          .then(() => {
            Logger.getInstance().info(
              `Connection (id: ${conn.rid}) closed by remote user.`,
            );
            this.removeConn(conn);
          });
      } else {
        TCPMsg.write(
          "[-] Cannot connect to taskmaster daemon (No space left)",
          { canConnect: false },
        )
          .then(() => {
            Logger.getInstance().error(
              `Connection (id: ${conn.rid}) rejected (No space left).`,
            );
            this.removeConn(conn);
          });
      }
    }
  }

  async closeAll() {
    try {
      const conns = Object.values(this.connections);
      const promiseRmConns = conns.map(async ({ conn, TCPMsg }) => {
        await TCPMsg.write("[*] Daemon has exited", { connected: false });
        this.removeConn(conn);
      });
      await Promise.all(promiseRmConns);
    } catch (_error) {
      // ignore
    }
  }
}
