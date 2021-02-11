use std::error::Error;
use std::io::prelude::*;
use std::io::{stdin, stdout};
extern crate terminfo;
use terminfo::{capability as cap, Database, Expand};

const RESET: &'static str = "\x1B[0m";
const CURSOR_POSITION: &'static str = "\x1B[7m";

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
	input: Vec<u8>,
	cursor: usize,
	info: Database,
}

impl Input {
	pub fn new() -> Self {
		let info = Database::from_env().unwrap();

		Input {
			command: Vec::with_capacity(25),
			input: Vec::with_capacity(3),
			cursor: 0,
			info,
		}
	}

	pub fn read(&mut self) -> Result<String, Box<dyn Error>> {
		self.read_nbytes(1);
		match self.parser() {
			Some(shortcut) => self.dispatcher(shortcut),
			None => {
				self.cursor += 1;
				self.command.push(self.input[0])
			}
		}
		self.input.clear();
		let mut cmd = String::from_utf8(self.command.clone())?;
		cmd.insert_str(
			self.cursor,
			&format!(
				"{}{}{}",
				CURSOR_POSITION,
				cmd.chars().nth(self.cursor - 1).unwrap(),
				RESET
			),
		);
		// cmd.insert_str(self.cursor, RESET);
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
		if let Some(27) = self.input.first() {
			println!("ARROW");
			self.read_nbytes(2);
			match self.input.last() {
				Some(65) => Some(Keyboard::Up),
				Some(66) => Some(Keyboard::Down),
				Some(67) => Some(Keyboard::Right),
				Some(68) => Some(Keyboard::Left),
				Some(ch) => {
					println!("UNKNOWN: {}", ch);
					None
				}
				None => {
					println!("Error input");
					None
				}
			}
		} else {
			None
		}
	}

	fn dispatcher(&mut self, shortcut: Keyboard) {
		match shortcut {
			Keyboard::Up => println!("Previous command in history"),
			Keyboard::Down => println!("Next command in history"),
			Keyboard::Left => println!("Move cursor to the left"),
			Keyboard::Right => println!("Move cursor to the right"),
			Keyboard::Backspace => println!("Remove char"),
		}
	}

	fn write_cap(&self, key: Keyboard) {
		let capability: String = match key {
			Keyboard::Left => self.info.get::<cap::CursorLeft>(),
			Keyboard::Right => self.info.get::<cap::CursorRight>(),
		};
		if let Some(capability) = self.info.get::<cap::CursorInvisible>() {
			stdout()
				.write_all(&capability.expand(&[], &mut Default::default()).unwrap())
				.unwrap();
		}
	}
}
