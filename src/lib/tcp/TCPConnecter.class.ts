import TCPMessage from "./TCPMessage.class.ts";

// This class needs an async constructor
// I used the "Object readiness design pattern"
// https://pdconsec.net/blogs/devnull/asynchronous-constructor-design-pattern
export default class TCPConnecter {
  public readonly Ready: Promise<void>;
  private conn?: Deno.Conn;
  private TCPMsg?: TCPMessage;

  constructor(port: number) {
    const init = async () => {
      this.conn = await Deno.connect({ port });
      this.TCPMsg = new TCPMessage(this.conn);

      const greetings = await this.TCPMsg.read();
      if (greetings?.payload?.canConnect) {
        console.info(`[*] Connected to 0.0.0.0:${port}`);
        console.log(greetings.msg);
      } else {
        throw new Error(
          greetings?.msg ?? "[-] Unknown error during connection to daemon",
        );
      }
    };

    this.Ready = init();
  }

  getTCPMsg() {
    return this.TCPMsg;
  }

  close() {
    this.conn?.close();
  }
}
