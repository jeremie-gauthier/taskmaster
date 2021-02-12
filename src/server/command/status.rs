use crate::server::command::utils::Command;
use crate::Config;
use std::error::Error;
use std::str::SplitAsciiWhitespace;

pub struct Status<'a> {
	args: SplitAsciiWhitespace<'a>,
	config: &'a mut Config,
	process_names: Option<Vec<&'a str>>,
	all_option: bool,
}

impl<'a> Status<'a> {
	pub const CMD_NAME: &'a str = "status";

	pub fn new(args: SplitAsciiWhitespace<'a>, config: &'a mut Config) -> Self {
		Status {
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
				acc.push_str(&format!("{}\n", process));
				acc
			});
			result.pop();
			result
		})
	}
}

impl<'a> Command for Status<'a> {
	fn parse_args(&mut self) -> Result<(), Box<dyn Error>> {
		match self.args.next() {
			Some(process_name) => {
				let mut list = vec![process_name];
				while let Some(process_name) = self.args.next() {
					list.push(process_name);
				}
				self.process_names = Some(list);
			}
			None => self.all_option = true,
		}
		Ok(())
	}

	fn exec(&mut self) -> Result<String, Box<dyn Error>> {
		if self.all_option {
			return self.exec_all();
		}
		let mut result = String::new();
		for name in self.process_names.as_ref().unwrap() {
			match self.config.process_mut(name) {
				Ok(process) => {
					result.push_str(&format!("{}", process));
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

	fn usage(&self) -> String {
		String::from(
			"status <name>\t\tGet status for a single process\n\
			status <name> <name>\tGet status for multiple named processes\n\
			status\t\tGet all process status info",
		)
	}
}
