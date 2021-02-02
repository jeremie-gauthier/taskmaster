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

	// UnixSocket example
	// https://github.com/BartMassey/unix-stream/tree/master/src
	pub fn run(&mut self) -> Result<(), Box<dyn Error>> {
		let reader = self.stream.try_clone().unwrap();
		let mut reader = std::io::BufReader::new(reader);

		loop {
			print!("taskmaster> ");
			stdout().flush()?;

			let mut input = String::new();
			stdin().read_line(&mut input)?;
			self.add_to_history(&input);

			write!(self.stream, "{}", input)?;
			self.stream.flush()?;
			// self.stream.write_all(input.as_bytes())?;
			// self.stream.flush()?;
			let mut response = String::new();
			// self.stream.read_to_string(&mut response)?;
			reader.read_line(&mut response).unwrap();
			println!("server said: {}", response);
		}
	}

	fn add_to_history(&mut self, input: &str) {
		self.history.insert(0, String::from(input))
	}
}
