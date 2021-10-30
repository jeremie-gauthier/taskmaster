const once = async (signo: number, handler: () => void) => {
  // @ts-ignore Deno.signal is an experimental feature
  await Deno.signal(signo);
  handler();
};

const on = async (signo: number, handler: () => void) => {
  // @ts-ignore Deno.signal is an experimental feature
  const sig = Deno.signal(signo);

  for await (const _ of sig) {
    console.log("got signal", signo);
    handler();
  }
  console.log("ended", signo);
};

export const signal = {
  once,
  on,
};
