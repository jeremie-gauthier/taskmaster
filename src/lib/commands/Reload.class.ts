import { SignalCode } from "../config/types.ts";
import Command from "./Command.class.ts";

export default class Reload extends Command {
  constructor(args: string[]) {
    super(args);
  }

  exec() {
    // @ts-ignore Deno.kill is an experimental feature
    Deno.kill(Deno.pid, SignalCode["HUP"]);
    return "Restarted taskmasterd";
  }

  usage() {
    return "reload\t\t\tRestart the remote taskmasterd.";
  }
}
