const PID_FILE = "./taskmasterd.pid";

export const writeServerPID = () => {
  try {
    const Encoder = new TextEncoder();
    return Deno.writeFile(PID_FILE, Encoder.encode(`${Deno.pid}`));
  } catch (_error) {
    return null;
  }
};

export const removeServerPID = () => {
  try {
    return Deno.remove(PID_FILE);
  } catch (_error) {
    return null;
  }
};
