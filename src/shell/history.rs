use crate::shell::traits::Reset;
use std::str;

#[derive(Debug)]
pub struct History {
	history: Vec<String>,
	history_index: usize,
}

impl History {
	pub fn new() -> Self {
		History {
			history: Vec::with_capacity(50),
			history_index: 0,
		}
	}

	pub fn prev(&mut self) -> String {
		if self.history.is_empty() {
			String::default()
		} else {
			let idx = self.history_index;
			if self.history_index < self.history.len() - 1 {
				self.history_index += 1;
			}
			self.history[idx].clone()
		}
	}

	pub fn next(&mut self) -> String {
		if self.history.is_empty() || self.history_index == 0 {
			String::default()
		} else {
			self.history_index -= 1;
			self.history[self.history_index].clone()
		}
	}

	pub fn insert(&mut self, command: &str) {
		if !command.trim().is_empty() {
			self.history.insert(0, String::from(command));
		}
	}
}

impl Reset for History {
	fn reset(&mut self) {
		self.history_index = 0;
	}
}
