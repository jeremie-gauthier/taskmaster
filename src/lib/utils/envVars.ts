import { isUndefined } from "./index.ts";

export const getTcpPort = () => {
  const TCP_PORT = Deno.env.get("TASKMASTER_TCP_PORT");

  if (isUndefined(TCP_PORT) || isNaN(parseInt(TCP_PORT))) {
    console.error(
      `[-] Env var [TCP_PORT] is not set or cannot be read properly`,
    );
    return null;
  }

  return parseInt(TCP_PORT);
};
