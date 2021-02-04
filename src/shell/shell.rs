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

		let response = self.read_socket_msg(&mut reader)?;
		if response.contains("Connection refused") {
			return Err(response)?;
		} else {
			// get process statuses
			print!("{}", response);
		}

		loop {
			print!("taskmaster> ");
			stdout().flush()?;

			let mut input = String::new();
			stdin().read_line(&mut input)?;
			self.add_to_history(&input);

			write!(self.stream, "{}", input)?;
			self.stream.flush()?;

			let response = self.read_socket_msg(&mut reader)?;
			print!("{}", response);
		}
	}

	fn add_to_history(&mut self, input: &str) {
		self.history.insert(0, String::from(input))
	}

	fn read_socket_msg(&self, reader: &mut dyn BufRead) -> Result<String, Box<dyn Error>> {
		let mut response_utf8 = Vec::new();
		reader.read_until(OUTPUT_DELIMITER as u8, &mut response_utf8)?;
		response_utf8.pop();
		Ok(String::from_utf8(response_utf8)?)
	}
}
