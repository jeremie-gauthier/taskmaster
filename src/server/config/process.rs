use crate::server::config::parameters::Parameters;
use crate::server::config::time::Time;
use std::error::Error;
use std::fmt;
use std::process::Child;
use std::time::SystemTime;

#[derive(Debug, PartialEq)]
pub enum ProcessStatus {
	Backoff,
	Exited,
	Fatal,
	Running,
	Starting,
	Stopped,
}

#[derive(Debug)]
pub struct Process {
	name: String,
	parameters: Parameters,
	handle: Option<Child>,
	status: ProcessStatus,
	should_reload: bool,
	sys_time: Option<SystemTime>,
}

impl Process {
	pub fn new(name: &str, parameters: Parameters) -> Self {
		let mut process = Process {
			name: name.to_string(),
			parameters,
			handle: None,
			status: ProcessStatus::Stopped,
			should_reload: false,
			sys_time: None,
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
			ProcessStatus::Starting => "STARTING",
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
					self.sys_time = Some(Time::now());
					Ok(format!("{}: started", self.name))
				}
				Err(err) => {
					eprintln!("{}", err);
					self.handle = None;
					self.status = ProcessStatus::Fatal;
					self.sys_time = None;
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
					self.sys_time = Some(Time::now());
					format!("{}: stopped", self.name)
				}
				Err(err) => format!("An error occured while exiting the process {}", err),
			},
			None => format!("{}: ERROR (not running)", self.name),
		}
	}

	fn get_pid(&self) -> u32 {
		self.handle.as_ref().unwrap().id()
	}
}

impl fmt::Display for Process {
	fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
		let description = match self.status {
			ProcessStatus::Backoff => {
				format!("Exited too quickly (process log may have details)")
			}
			ProcessStatus::Starting => format!(""),
			ProcessStatus::Running => format!(
				"pid {}, uptime {}",
				self.get_pid(),
				match self.sys_time {
					Some(time) => Time::elapsed(time),
					None => String::from("???"),
				}
			),
			ProcessStatus::Stopped => match self.sys_time {
				Some(time) => format!("{} ago", Time::elapsed(time)),
				None => format!("Not started"),
			},
			_ => format!("???"),
		};
		write!(f, "{}\t\t\t{}\t\t{}", self.name, self.status(), description)
	}
}
