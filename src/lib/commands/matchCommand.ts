import Exit from "./Exit.class.ts";
import Help from "./Help.class.ts";
import Reload from "./Reload.class.ts";
import Restart from "./Restart.class.ts";
import Shutdown from "./Shutdown.class.ts";
import Start from "./Start.class.ts";
import Status from "./Status.class.ts";
import Stop from "./Stop.class.ts";

const matchCommand = (
  cmd: string,
) => {
  switch (cmd.toLowerCase()) {
    case Status.name.toLowerCase():
      return Status;
    case Start.name.toLowerCase():
      return Start;
    case Stop.name.toLowerCase():
      return Stop;
    case Restart.name.toLowerCase():
      return Restart;
    case Help.name.toLowerCase():
      return Help;
    case Reload.name.toLowerCase():
      return Reload;
    case Exit.name.toLowerCase():
      return Exit;
    case Shutdown.name.toLowerCase():
      return Shutdown;
    default:
      return null;
  }
};

export default matchCommand;
