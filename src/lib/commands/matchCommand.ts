// import Command from "./Command.class.ts";
import Start from "./Start.class.ts";

const matchCommand = (cmd: string): any => {
  // console.log(Start.name);

  // let cmdResponse: string;
  switch (cmd.toLowerCase()) {
    case Start.name.toLowerCase():
      return Start;
    default:
      return null;
  }
};

export default matchCommand;
