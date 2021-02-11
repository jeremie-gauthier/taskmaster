use crate::server::config::parameters::Parameters;
use std::error::Error;
use std::process::Child;

#[derive(Debug, PartialEq)]
pub enum ProcessStatus {
	Backoff,
	Exited,
	Fatal,
	Running,
	Stopped,
}

#[derive(Debug)]
pub struct Process {
	name: String,
	parameters: Parameters,
	handle: Option<Child>,
	status: ProcessStatus,
	should_reload: bool,
}

impl Process {
	pub fn new(name: &str, parameters: Parameters) -> Self {
		let mut process = Process {
			name: name.to_string(),
			parameters,
			handle: None,
			status: ProcessStatus::Stopped,
			should_reload: false,
		};

		if process.parameters.autostart {
			if process.start().is_err() {
				eprintln!("Autostart failed");
			};
		}
		process
	}

	pub fn status(&self) -> String {
		String::from(match self.status {
			ProcessStatus::Backoff => "BACKOFF",
			ProcessStatus::Exited => "EXITED",
			ProcessStatus::Fatal => "FATAL",
			ProcessStatus::Running => "RUNNING",
			ProcessStatus::Stopped => "STOPPED",
		})
	}

	pub fn is_running(&self) -> bool {
		self.status == ProcessStatus::Running
	}

	pub fn start(&mut self) -> Result<String, Box<dyn Error>> {
		match self.handle {
			Some(_) => Err(format!("{}: ERROR (already started)", self.name))?,
			None => match self.parameters.command.spawn() {
				Ok(handle) => {
					self.handle = Some(handle);
					self.status = ProcessStatus::Running;
					Ok(format!("{}: started", self.name))
				}
				Err(err) => {
					eprintln!("{}", err);
					self.handle = None;
					self.status = ProcessStatus::Fatal;
					Err(format!("{}: ERROR (spawn error)", self.name))?
				}
			},
		}
	}

	pub fn stop(&mut self) -> String {
		match self.handle.as_mut() {
			Some(handle) => match handle.kill() {
				Ok(_) => {
					self.handle = None;
					self.status = ProcessStatus::Stopped;
					format!("{}: stopped", self.name)
				}
				Err(err) => format!("An error occured while exiting the process {}", err),
			},
			None => format!("{}: ERROR (not running)", self.name),
		}
	}
}
