use std::error::Error;
use std::io::prelude::*;
use std::io::{stdin, stdout};

const CURSOR_FORWARD: &'static str = "\x1B[C";
const CURSOR_BACKWARD: &'static str = "\x1B[D";

enum Keyboard {
	Up,
	Down,
	Right,
	Left,
	Backspace,
}

#[derive(Debug)]
pub struct Input {
	command: Vec<u8>,
	command_length: usize,
	input: Vec<u8>,
	cursor: usize,
}

impl Input {
	pub fn new() -> Self {
		Input {
			command: Vec::with_capacity(100),
			command_length: 0,
			input: Vec::with_capacity(3),
			cursor: 0,
		}
	}

	pub fn read(&mut self) -> Result<String, Box<dyn Error>> {
		self.read_nbytes(1);
		match self.parser() {
			Some(shortcut) => self.dispatcher(shortcut),
			None => {
				if self
					.input
					.iter()
					.all(|ch| ch.is_ascii_alphanumeric() || ch.is_ascii_whitespace())
				{
					self.command.insert(self.cursor, self.input[0]);
					self.command_length += 1;
					self.cursor += 1;
				}
			}
		}
		self.input.clear();
		let cmd = String::from_utf8(self.command.clone())?;
		// println!("{:?}", self.command);
		Ok(cmd)
	}

	fn read_nbytes(&mut self, limit: u64) {
		stdin()
			.take(limit)
			.read_to_end(&mut self.input)
			.unwrap_or_default();
	}

	fn parser(&mut self) -> Option<Keyboard> {
		// println!("{:?}", self.input);
		match self.input.first() {
			Some(27) => {
				self.read_nbytes(2);
				match self.input.last() {
					Some(65) => Some(Keyboard::Up),
					Some(66) => Some(Keyboard::Down),
					Some(67) => Some(Keyboard::Right),
					Some(68) => Some(Keyboard::Left),
					_ => None,
				}
			}
			Some(127) => Some(Keyboard::Backspace),
			_ => None,
		}
	}

	fn dispatcher(&mut self, shortcut: Keyboard) {
		match shortcut {
			Keyboard::Up => println!("Previous command in history"),
			Keyboard::Down => println!("Next command in history"),
			Keyboard::Left => {
				if self.cursor > 0 {
					self.cursor -= 1;
					write!(self.command, "{}", CURSOR_BACKWARD).unwrap();
				}
			}
			Keyboard::Right => {
				if self.cursor < self.command_length {
					self.cursor += 1;
					write!(self.command, "{}", CURSOR_FORWARD).unwrap();
				}
			}
			Keyboard::Backspace => {
				if self.cursor > 0 {
					self.command.drain((self.cursor - 1)..self.cursor);
					self.command_length -= 1;
					self.cursor -= 1;
				}
			}
		}
	}
}
