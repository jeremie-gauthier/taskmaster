use crate::shell::command::Command;
use crate::Config;
use std::error::Error;
use std::io::{stdin, stdout, Write};

pub fn shell(config: Config) -> Result<(), Box<dyn Error>> {
	let mut command = Command::new(config);

	loop {
		print!("taskmaster> ");
		stdout().flush()?;

		let mut input = String::new();
		stdin().read_line(&mut input)?;

		command.parse(&input);
	}
}
