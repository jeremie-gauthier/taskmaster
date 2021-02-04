use crate::shell::command::utils::Command;
use crate::Config;
use std::error::Error;
use std::str::SplitAsciiWhitespace;

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
			Some(name) => match name {
				"all" => Ok({
					let iter = self.config.processes_mut()?;
					let mut result = iter.fold(String::new(), |mut acc, (_, process)| {
						if !process.is_running() {
							let response = process.start();
							acc.push_str(&response);
							acc.push('\n');
						}
						acc
					});
					result.pop();
					result
				}),
				_ => Ok(self.config.process_mut(name)?.start()),
			},
			None => Err(format!(
				"Error: start requires a process name\n{}",
				START_USAGE
			))?,
		}
	}
}
