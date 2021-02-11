use std::error::Error;

#[derive(Debug)]
pub enum Cmd {
	Start,
	Stop,
	Restart,
}

pub trait Command {
	fn parse_args(&mut self) -> Result<(), Box<dyn Error>>;
	fn exec(&mut self) -> Result<String, Box<dyn Error>>;
}