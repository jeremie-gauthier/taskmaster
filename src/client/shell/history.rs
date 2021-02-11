use crate::shell::traits::Reset;
use std::str;

#[derive(Debug)]
pub struct History {
	history: Vec<String>,
	history_index: usize,
}

impl History {
	pub fn new() -> Self {
		let mut history = Vec::with_capacity(50);
		history.push(String::default());

		History {
			history,
			history_index: 0,
		}
	}

	pub fn prev(&mut self) -> String {
		if self.history_index < self.history.len() - 1 {
			self.history_index += 1;
		}
		self.history[self.history_index].clone()
	}

	pub fn next(&mut self) -> String {
		if self.history_index > 0 {
			self.history_index -= 1;
		}
		self.history[self.history_index].clone()
	}

	pub fn insert(&mut self, command: &str) {
		if !command.trim().is_empty() {
			self.history.insert(1, String::from(command));
		}
	}
}

impl Reset for History {
	fn reset(&mut self) {
		self.history_index = 0;
	}
}

#[cfg(test)]
mod tests {
	use super::*;

	macro_rules! history_init {
		() => {{
			let mut history = History::new();
			history.insert("AAAA");
			history.insert("BBBB");
			history.insert("CCCC");
			history
		}};
	}

	#[test]
	fn insert_in_history() {
		let mut history = History::new();
		assert_eq!(history.history[0], String::default());
		history.insert("hello");
		assert_eq!(history.history[1], "hello");
	}

	#[test]
	fn prev_in_history() {
		let mut history = history_init!();
		assert_eq!(history.prev(), "CCCC");
		assert_eq!(history.prev(), "BBBB");
		assert_eq!(history.prev(), "AAAA");
		assert_eq!(history.prev(), "AAAA");
		assert_eq!(history.prev(), "AAAA");
	}

	#[test]
	fn next_in_history() {
		let mut history = history_init!();
		assert_eq!(history.next(), "");
		assert_eq!(history.prev(), "CCCC");
		assert_eq!(history.prev(), "BBBB");
		assert_eq!(history.next(), "CCCC");
		assert_eq!(history.next(), "");
	}

	#[test]
	fn reset_history() {
		let mut history = history_init!();
		history.prev();
		history.prev();
		assert_eq!(history.history_index, 2);
		history.reset();
		assert_eq!(history.history_index, 0);
	}
}
