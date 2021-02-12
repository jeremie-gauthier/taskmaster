use std::error::Error;

pub trait Command {
	fn parse_args(&mut self) -> Result<(), Box<dyn Error>>;
	fn exec(&mut self) -> Result<String, Box<dyn Error>>;
	fn usage(&self) -> String;
}
