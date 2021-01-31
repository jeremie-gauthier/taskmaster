use crate::shell::command::utils::dispatch;
use crate::Config;
use std::error::Error;
use std::io::{stdin, stdout, Write};

#[derive(Debug)]
pub struct Shell {
	history: Vec<String>,
	config: Config,
}

impl Shell {
	pub fn new(config: Config) -> Self {
		Shell {
			history: Vec::with_capacity(50),
			config,
		}
	}

	pub fn run(&mut self) -> Result<(), Box<dyn Error>> {
		loop {
			print!("taskmaster> ");
			stdout().flush()?;

			let mut input = String::new();
			stdin().read_line(&mut input)?;
			self.add_to_history(&input);

			match dispatch(&input, &mut self.config) {
				Ok(_) => (),
				Err(err) => eprintln!("{}", err),
			};
		}
	}

	fn add_to_history(&mut self, input: &str) {
		self.history.insert(0, String::from(input))
	}
}
