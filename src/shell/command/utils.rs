use crate::shell::command::start::Start;
use crate::Config;
use std::error::Error;

#[derive(Debug)]
pub enum Cmd {
	Start,
	Stop,
	Restart,
}

pub trait Command {
	fn parse_args(&mut self) -> Result<(), Box<dyn Error>>;
	fn exec(&mut self) -> Result<(), Box<dyn Error>>;
}

pub fn dispatch(input: &str, config: &mut Config) -> Result<(), Box<dyn Error>> {
	let mut tokens = input.split_ascii_whitespace();
	let (cmd, args) = match tokens.next() {
		Some(cmd) => (cmd.to_ascii_lowercase(), tokens),
		None => return Ok(()),
	};

	let mut command = match cmd.as_ref() {
		"start" => Start::new(args, config),
		_ => Err(format!("*** Unknown syntax: {}", input))?,
	};

	command.parse_args()?;
	command.exec()?;
	Ok(())
}
