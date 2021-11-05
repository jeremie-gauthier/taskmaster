import { isEmpty, isUndefined } from "../utils/index.ts";

type Payload = Record<string, unknown>;

export type JSONMessage = {
  msg: string;
  payload?: Payload;
};
export default class TCPMessage {
  private conn: Deno.Conn;
  private static Encoder = new TextEncoder();
  private static Decoder = new TextDecoder();
  private static BUFFER_SIZE = 4096;

  constructor(conn: Deno.Conn) {
    this.conn = conn;
  }

  async write(msg: string, payload?: Payload) {
    if (isEmpty(msg) && isUndefined(payload)) return;

    try {
      const data: JSONMessage = { msg, payload };
      const encodedMsg = TCPMessage.Encoder.encode(JSON.stringify(data));
      await this.conn.write(encodedMsg);
    } catch (_error) {
      console.error(`[-] Cannot write TCP message (Connection reset by peer)`);
      Deno.exit(1);
    }
  }

  private async getTCPMessage() {
    const buffer = new Uint8Array(TCPMessage.BUFFER_SIZE);
    let nBytesRead = await this.conn.read(buffer);
    let message = TCPMessage.Decoder.decode(buffer).substr(
      0,
      nBytesRead ?? 0,
    );

    while (nBytesRead && nBytesRead === TCPMessage.BUFFER_SIZE) {
      nBytesRead = await Promise.race([
        this.conn.read(buffer),
        new Promise<number>((resolve) => {
          setTimeout(() => resolve(0), 100);
        }),
      ]);
      const rawMessage = TCPMessage.Decoder.decode(buffer);
      message = `${message}${rawMessage.substr(0, nBytesRead ?? 0)}`;
    }

    return message;
  }

  async read() {
    try {
      const message = await this.getTCPMessage();
      return JSON.parse(message) as JSONMessage;
    } catch (_error) {
      console.error(`[-] Cannot read TCP message (Connection reset by peer)`);
      Deno.exit(1);
    }
  }

  async *iterRead(): AsyncIterableIterator<JSONMessage> {
    while (true) {
      try {
        const message = await this.getTCPMessage();
        yield JSON.parse(message);
      } catch (_error) {
        console.error(`[-] Cannot read TCP message (Connection reset by peer)`);
        break;
      }
    }
  }
}
