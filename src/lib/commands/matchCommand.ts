// import Command from "./Command.class.ts";
import Restart from "./Restart.class.ts";
import Start from "./Start.class.ts";
import Stop from "./Stop.class.ts";

const matchCommand = (cmd: string) => {
  switch (cmd.toLowerCase()) {
    case Start.name.toLowerCase():
      return Start;
    case Restart.name.toLowerCase():
      return Restart;
    case Stop.name.toLowerCase():
      return Stop;
    default:
      return null;
  }
};

export default matchCommand;
