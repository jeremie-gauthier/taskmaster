use crate::shell::command::utils::Command;
use crate::Config;
use std::error::Error;
use std::str::SplitAsciiWhitespace;

const START_USAGE: &'static str =
	"start <name>\t\tStart a process\nstart <name> <name>\t\tStart multiple processes\nstart all\t\tStart all processes";

pub struct Start<'a> {
	args: SplitAsciiWhitespace<'a>,
	config: &'a mut Config,
	process_names: Option<Vec<&'a str>>,
	all_option: bool,
}

impl<'a> Start<'a> {
	pub fn new(args: SplitAsciiWhitespace<'a>, config: &'a mut Config) -> Self {
		Start {
			args,
			config,
			process_names: None,
			all_option: false,
		}
	}

	fn exec_all(&mut self) -> Result<String, Box<dyn Error>> {
		Ok({
			let iter = self.config.processes_mut()?;
			let mut result = iter.fold(String::new(), |mut acc, (_, process)| {
				if !process.is_running() {
					let response = process.start().unwrap_or_default();
					acc.push_str(&response);
					acc.push('\n');
				}
				acc
			});
			result.pop();
			result
		})
	}
}

impl<'a> Command for Start<'a> {
	fn parse_args(&mut self) -> Result<(), Box<dyn Error>> {
		match self.args.next() {
			Some(process_name) => {
				if process_name == "all" {
					self.all_option = true;
					return Ok(());
				}
				let mut list = vec![process_name];
				while let Some(process_name) = self.args.next() {
					if process_name == "all" {
						self.all_option = true;
						return Ok(());
					}
					list.push(process_name);
				}
				self.process_names = Some(list);
				Ok(())
			}
			None => Err(format!(
				"Error: start requires a process name\n{}",
				START_USAGE
			))?,
		}
	}

	fn exec(&mut self) -> Result<String, Box<dyn Error>> {
		if self.all_option {
			return self.exec_all();
		}
		let mut result = String::new();
		for name in self.process_names.as_ref().unwrap() {
			match self.config.process_mut(name) {
				Ok(process) => {
					let response = process.start()?;
					result.push_str(&response);
					result.push('\n');
				}
				Err(err) => {
					result.push_str(&err.to_string());
					result.push('\n');
				}
			};
		}
		result.pop();
		Ok(result)
	}
}
