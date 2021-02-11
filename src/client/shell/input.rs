use crate::shell::history::History;
use crate::shell::traits::Reset;
use std::error::Error;
use std::io::prelude::*;
use std::io::{stdin, stdout};
use std::{fmt, str};

const SHELL_PROMPT: &'static str = "\x1B[2K\rtaskmaster> ";
const NEW_LINE: u8 = '\n' as u8;
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
	history: History,
}

impl Input {
	pub fn new() -> Self {
		Input {
			command: Vec::with_capacity(100),
			command_length: 0,
			input: Vec::with_capacity(3),
			cursor: 0,
			history: History::new(),
		}
	}

	pub fn read_line(&mut self) -> Result<String, Box<dyn Error>> {
		let is_valid_input = |input: &Vec<u8>| {
			input
				.iter()
				.all(|ch| ch.is_ascii_alphanumeric() || ch.is_ascii_whitespace())
		};

		loop {
			print!("{}", &self);
			stdout().flush()?;

			self.read_nbytes(1);
			match self.parser() {
				Some(shortcut) => self.dispatcher(shortcut),
				None => {
					if let Some(&NEW_LINE) = self.input.first() {
						break;
					}

					if is_valid_input(&self.input) {
						self.command.insert(self.cursor, self.input[0]);
						self.command_length += 1;
						self.cursor += 1;
					}
				}
			}
			self.input.clear();
		}

		println!("{}", &self);
		let cmd = String::from_utf8(self.command.clone())?;
		self.history.insert(&cmd);
		self.history.reset();
		self.reset();
		Ok(cmd)
	}

	fn read_nbytes(&mut self, limit: u64) {
		stdin()
			.take(limit)
			.read_to_end(&mut self.input)
			.unwrap_or_default();
	}

	fn parser(&mut self) -> Option<Keyboard> {
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
			Keyboard::Up => {
				self.command = self.history.prev().into_bytes();
				self.command_length = self.command.len();
				self.cursor = self.command.len();
			}
			Keyboard::Down => {
				self.command = self.history.next().into_bytes();
				self.command_length = self.command.len();
				self.cursor = self.command.len();
			}
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

impl fmt::Display for Input {
	fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
		write!(
			f,
			"{}{}",
			SHELL_PROMPT,
			str::from_utf8(&self.command).unwrap_or("")
		)
	}
}

impl Reset for Input {
	fn reset(&mut self) {
		self.command.clear();
		self.command_length = 0;
		self.input.clear();
		self.cursor = 0;
	}
}
