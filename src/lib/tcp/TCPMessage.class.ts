import { isEmpty, isNull, isUndefined } from "../utils/index.ts";

type Payload = Record<string, unknown>;

export type JSONMessage = {
  msg: string;
  payload?: Payload;
};
export default class TCPMessage {
  private conn: Deno.Conn;
  private static Encoder = new TextEncoder();
  private static Decoder = new TextDecoder();
  private static BUFFER_SIZE = 1024;

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

  async read() {
    try {
      const buffer = new Uint8Array(TCPMessage.BUFFER_SIZE);
      const nBytesRead = await this.conn.read(buffer);
      if (isNull(nBytesRead) || nBytesRead === 0) {
        return null;
      }
      const rawMessage = TCPMessage.Decoder.decode(buffer);
      const message = rawMessage.substr(0, nBytesRead ?? 0);
      return JSON.parse(message) as JSONMessage;
    } catch (_error) {
      console.error(`[-] Cannot read TCP message (Connection reset by peer)`);
      Deno.exit(1);
    }
  }

  async *iterRead(): AsyncIterableIterator<JSONMessage> {
    const buffer = new Uint8Array(TCPMessage.BUFFER_SIZE);

    while (true) {
      try {
        const nBytesRead = await this.conn.read(buffer);
        if (isNull(nBytesRead)) {
          break;
        } else if (nBytesRead === 0) {
          continue;
        }
        const rawMessage = TCPMessage.Decoder.decode(buffer);
        const message = rawMessage.substr(0, nBytesRead ?? 0);
        yield JSON.parse(message);
      } catch (_error) {
        console.error(`[-] Cannot read TCP message (Connection reset by peer)`);
        break;
      }
    }
  }
}
