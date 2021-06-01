import { isEmpty } from "../utils/index.ts";

export default class TCPMessage {
  private conn: Deno.Conn;
  private static Encoder = new TextEncoder();
  private static Decoder = new TextDecoder();
  private static BUFFER_SIZE = 1024;

  constructor(conn: Deno.Conn) {
    this.conn = conn;
  }

  async write(msg: string) {
    if (isEmpty(msg)) return;

    try {
      const encodedMsg = TCPMessage.Encoder.encode(msg);
      await this.conn.write(encodedMsg);
    } catch (error) {
      console.error(`[-] Cannot write TCP message (${error})`);
    }
  }

  async read() {
    try {
      const buffer = new Uint8Array(TCPMessage.BUFFER_SIZE);
      const nBytesRead = await this.conn.read(buffer);
      const rawInput = TCPMessage.Decoder.decode(buffer);
      const input = rawInput.substr(0, nBytesRead ?? 0);
      return input;
    } catch (error) {
      console.error(`[-] Cannot read TCP message (${error})`);
      return null;
    }
  }
}
