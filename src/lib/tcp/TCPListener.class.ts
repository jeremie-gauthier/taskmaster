import TCPMessage from "./TCPMessage.class.ts";

type TCPListenerOptions = {
  maxConn: number;
};

type OnConnectCallback = (TCPMsg: TCPMessage) => Promise<void>;

export default class TCPListener {
  private activeConn = 0;
  private options = {
    maxConn: 5,
  };
  private listener: Deno.Listener;

  constructor(port: number, options?: Partial<TCPListenerOptions>) {
    this.options = { ...this.options, ...options };
    this.listener = Deno.listen({ port });
    console.info("[*] Listening on 0.0.0.0:8080");
  }

  private canConnect = () => this.activeConn < this.options.maxConn;

  async handleIncomingConn(onConnect: OnConnectCallback) {
    for await (const conn of this.listener) {
      const TCPMsg = new TCPMessage(conn);

      // using `then` instead of `async` here for non-blocking thread
      // else it would stuck and block other connections
      if (this.canConnect()) {
        onConnect(TCPMsg)
          .then(conn.close);
      } else {
        TCPMsg.write("[-] Cannot connect to taskmaster daemon (No space left)")
          .then(conn.close);
      }
    }
  }
}
