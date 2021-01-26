use std::process::{Child, Command, Stdio};

pub enum ProcessStatus {
	EXITED,
	STOPPED,
	RUNNING,
}

pub struct Process {
	command: Command,
	handle: Option<Child>,
	status: ProcessStatus,
}

impl Process {
	pub fn new(command: &str) -> Self {
		Process {
			command: Command::new(command),
			handle: None,
			status: ProcessStatus::STOPPED,
		}
	}

	pub fn start(&mut self) {
		self.command
			.stdin(Stdio::null())
			.stdout(Stdio::null())
			.stderr(Stdio::null());
		self.handle = match self.command.spawn() {
			Ok(handle) => {
				self.status = ProcessStatus::RUNNING;
				Some(handle)
			}
			Err(err) => {
				self.status = ProcessStatus::EXITED;
				eprintln!("An error occured while starting the process {}", err);
				None
			}
		};
	}

	pub fn stop(&mut self) {
		self.command
			.stdin(Stdio::null())
			.stdout(Stdio::null())
			.stderr(Stdio::null());
		match self.handle.as_mut() {
			Some(handle) => match handle.kill() {
				Ok(handle) => println!("Process {:?} exited successfully", handle),
				Err(err) => eprintln!("An error occured while exiting the process {}", err),
			},
			None => eprintln!("This process has already exited"),
		}
	}
}
