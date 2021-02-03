use crate::OUTPUT_DELIMITER;
use std::error::Error;
use std::io::prelude::*;
use std::io::{stdin, stdout, Write};
use std::os::unix::net::UnixStream;

#[derive(Debug)]
pub struct Shell {
	history: Vec<String>,
	stream: UnixStream,
}

impl Shell {
	pub fn new(stream: UnixStream) -> Self {
		Shell {
			history: Vec::with_capacity(50),
			stream,
		}
	}

	pub fn run(&mut self) -> Result<(), Box<dyn Error>> {
		let mut reader = match self.stream.try_clone() {
			Ok(reader) => std::io::BufReader::new(reader),
			Err(err) => return Err(err)?,
		};

		let mut response_utf8 = Vec::new();
		reader.read_until(OUTPUT_DELIMITER as u8, &mut response_utf8)?;
		response_utf8.pop();
		let response_str = String::from_utf8(response_utf8)?;
		if response_str.contains("Connection refused") {
			return Err(response_str)?;
		} else {
			println!("{}", response_str);
		}

		loop {
			print!("taskmaster> ");
			stdout().flush()?;

			let mut input = String::new();
			stdin().read_line(&mut input)?;
			self.add_to_history(&input);

			write!(self.stream, "{}", input)?;
			self.stream.flush()?;

			let mut response_utf8 = Vec::new();
			reader.read_until(OUTPUT_DELIMITER as u8, &mut response_utf8)?;
			response_utf8.pop();
			let response_str = String::from_utf8(response_utf8)?;
			println!("{}", response_str);
		}
	}

	fn add_to_history(&mut self, input: &str) {
		self.history.insert(0, String::from(input))
	}
}
