use crate::shell::input::Input;
use crate::OUTPUT_DELIMITER;
use std::error::Error;
use std::io::prelude::*;
use std::os::unix::net::UnixStream;
use termios::*;

#[derive(Debug)]
pub struct Shell {
	origin_term_config: Termios,
	termios: Termios,
	stream: UnixStream,
}

impl Shell {
	pub fn new(stream: UnixStream) -> Self {
		let origin_term_config = Termios::from_fd(0).unwrap();
		let mut termios = origin_term_config.clone();
		tcgetattr(0, &mut termios).unwrap();
		termios.c_lflag &= !(ECHO | ICANON);
		termios.c_cc[VMIN] = 1;
		termios.c_cc[VTIME] = 0;
		tcsetattr(0, TCSANOW, &termios).unwrap();

		Shell {
			origin_term_config,
			termios,
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

		let mut input = Input::new();
		loop {
			let command = input.read_line()?;

			writeln!(self.stream, "{}", command)?;

			let response = self.read_socket_msg(&mut reader)?;
			print!("{}", response);
		}
	}

	fn read_socket_msg(&self, reader: &mut dyn BufRead) -> Result<String, Box<dyn Error>> {
		let mut response_utf8 = Vec::new();
		reader.read_until(OUTPUT_DELIMITER as u8, &mut response_utf8)?;
		response_utf8.pop();
		Ok(String::from_utf8(response_utf8)?)
	}
}

impl Drop for Shell {
	fn drop(&mut self) {
		tcsetattr(0, TCSANOW, &self.origin_term_config).unwrap();
	}
}
