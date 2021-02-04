use std::process::{Child, Command, Stdio};

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
	command: Command,
	handle: Option<Child>,
	status: ProcessStatus,
	should_reload: bool,
}

impl Process {
	pub fn new(name: &str, command: &str) -> Self {
		Process {
			name: name.to_string(),
			command: Command::new(command),
			handle: None,
			status: ProcessStatus::Stopped,
			should_reload: false,
		}
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

	pub fn start(&mut self) -> String {
		self.command
			.stdin(Stdio::null())
			.stdout(Stdio::null())
			.stderr(Stdio::null());
		match self.handle {
			Some(_) => format!("{}: ERROR (already started)", self.name),
			None => {
				self.handle = match self.command.spawn() {
					Ok(handle) => {
						self.status = ProcessStatus::Running;
						Some(handle)
					}
					Err(_) => {
						self.status = ProcessStatus::Fatal;
						None
					}
				};

				if self.handle.is_some() {
					format!("{}: started", self.name)
				} else {
					format!("{}: ERROR (spawn error)", self.name)
				}
			}
		}
	}

	pub fn stop(&mut self) -> String {
		self.command
			.stdin(Stdio::null())
			.stdout(Stdio::null())
			.stderr(Stdio::null());
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
