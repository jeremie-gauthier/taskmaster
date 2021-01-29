use std::process::{Child, Command, Stdio};

#[derive(Debug)]
pub enum ProcessStatus {
	Exited,
	Stopped,
	Running,
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

	pub fn start(&mut self) {
		self.command
			.stdin(Stdio::null())
			.stdout(Stdio::null())
			.stderr(Stdio::null());
		self.handle = match self.command.spawn() {
			Ok(handle) => {
				self.status = ProcessStatus::Running;
				Some(handle)
			}
			Err(err) => {
				self.status = ProcessStatus::Exited;
				eprintln!("An error occured while Stopped the process {}", err);
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
