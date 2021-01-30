use crate::Config;
use std::error::Error;

#[derive(Debug)]
enum Cmd {
	Start,
	Stop,
	Restart,
}

#[derive(Debug)]
pub struct Command {
	history: Vec<String>,
	config: Config,
}

impl Command {
	pub fn new(config: Config) -> Self {
		Command {
			history: Vec::with_capacity(50),
			config,
		}
	}

	pub fn parse(&mut self, input: &str) -> Result<(), Box<dyn Error>> {
		let mut tokens = input.split_ascii_whitespace();

		let cmd = match tokens.next() {
			Some(cmd) => match_input_with_cmd(cmd),
			None => return Ok(()),
		};
		let process = tokens.next();

		match (cmd, process) {
			(Ok(cmd), Some(process)) => self.exec(cmd, process),
			(Err(err), Some(_)) => Err(err)?,
			(_, _) => Err(format!("Error while parsing the input"))?,
		}
	}

	fn exec(&mut self, cmd: Cmd, process_name: &str) -> Result<(), Box<dyn Error>> {
		let process = self.config.process_mut(process_name);
		match process {
			Some(process) => Ok(match cmd {
				Cmd::Start => process.start(),
				Cmd::Stop => process.stop(),
				Cmd::Restart => {
					process.stop();
					process.start();
				}
			}),
			None => Err(format!("{} is not an available program", process_name))?,
		}
	}
}

fn match_input_with_cmd(input: &str) -> Result<Cmd, Box<dyn Error>> {
	let cmd = input.to_ascii_lowercase();
	match cmd.as_ref() {
		"start" => Ok(Cmd::Start),
		"stop" => Ok(Cmd::Stop),
		"restart" => Ok(Cmd::Restart),
		_ => Err(format!("{} doesn't exist", cmd))?,
	}
}
