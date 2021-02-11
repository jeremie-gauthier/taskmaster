use std::error::Error;
use std::fs::OpenOptions;
use std::process::{Command, Stdio};
use yaml_rust::Yaml;

#[derive(Debug)]
pub struct Parameters {
	pub command: Command,
	pub autostart: bool,
	pub stdout: String,
	pub stderr: String,
}

impl Parameters {
	pub fn new(yaml_params: &Yaml) -> Self {
		let command = Parameters::create_command(yaml_params["cmd"].as_str().unwrap_or_default());
		let autostart = yaml_params["autostart"].as_bool().unwrap_or_default();
		let stdout = String::from(yaml_params["stdout"].as_str().unwrap_or("/dev/null"));
		let stderr = String::from(yaml_params["stderr"].as_str().unwrap_or("/dev/null"));

		let mut parameters = Parameters {
			command,
			autostart,
			stdout,
			stderr,
		};

		parameters.apply_redirection();
		parameters
	}
}

impl Parameters {
	fn create_command(input: &str) -> Command {
		let mut command = Command::new("/bin/bash");
		command.arg("-c").arg(input);
		command
	}

	fn apply_redirection(&mut self) {
		let stdout = Parameters::open_or_create(&self.stdout).unwrap();
		let stderr = Parameters::open_or_create(&self.stderr).unwrap();

		self.command.stdout(stdout).stderr(stderr);
	}

	pub fn open_or_create(path: &str) -> Result<Stdio, Box<dyn Error>> {
		Ok(Stdio::from(
			OpenOptions::new()
				.create(true)
				.read(true)
				.write(true)
				.open(path)?,
		))
	}
}
