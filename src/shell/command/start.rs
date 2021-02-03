use crate::shell::command::utils::Command;
use crate::Config;
use std::error::Error;
use std::str::SplitAsciiWhitespace;
use std::sync::{Arc, Mutex};

const START_USAGE: &'static str =
	"start <name>\t\tStart a process\nstart all\t\tStart all processes";

pub struct Start<'a> {
	args: SplitAsciiWhitespace<'a>,
	config: &'a mut Config,
	process_name: Option<&'a str>,
}

impl<'a> Start<'a> {
	pub fn new(args: SplitAsciiWhitespace<'a>, config: &'a mut Config) -> Self {
		Start {
			args,
			config,
			process_name: None,
		}
	}
}

impl<'a> Command for Start<'a> {
	fn parse_args(&mut self) -> Result<(), Box<dyn Error>> {
		match self.args.next() {
			Some(process_name) => {
				self.process_name = Some(process_name);
				Ok(())
			}
			None => Err(format!(
				"Error: start requires a process name\n{}",
				START_USAGE
			))?,
		}
	}

	fn exec(&mut self) -> Result<String, Box<dyn Error>> {
		match self.process_name {
			Some(name) => {
				// let mut config = *self.config.lock().unwrap();
				// Ok(config.process_mut(name)?.start())
				Ok(self.config.process_mut(name)?.start())
			}
			None => Err(format!(
				"Error: start requires a process name\n{}",
				START_USAGE
			))?,
		}
	}
}
