import TCPMessage from "../tcp/TCPMessage.class.ts";

const repl = async (TCPMsg: TCPMessage) => {
  while (true) {
    const input = prompt("> ");

    if (input) {
      if (input === "exit") {
        break;
      }

      await TCPMsg.write(input);

      const response = await TCPMsg.read();
      if (response) {
        console.log(response.msg);
      }

      if (input === "shutdown") {
        break;
      }
    } else {
      console.log();
    }
  }
};

export default repl;
