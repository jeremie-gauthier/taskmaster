import TCPMessage from "../tcp/TCPMessage.class.ts";

const repl = async (TCPMsg: TCPMessage) => {
  let read = true;

  while (read) {
    const input = prompt("> ");

    if (input) {
      await TCPMsg.write(input);
      const response = await TCPMsg.read();
      console.log(response);
      if (input === "exit") {
        read = false;
      }
    } else {
      console.log();
    }
  }
};

export default repl;
