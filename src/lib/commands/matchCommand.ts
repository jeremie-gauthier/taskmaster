import Command from "./Command.class.ts";
import Start from "./Start.class.ts";

const matchCommand = (str: string): Command | null => {
  console.log(Start.name);
  switch (str) {
    case Start.name.toLowerCase():
      return new Start();
    default:
      return null;
  }
};

export default matchCommand;
