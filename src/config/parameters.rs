use std::error::Error;
use std::fs::OpenOptions;
use std::process::{Command, Stdio};
use yaml_rust::Yaml;

#[derive(Debug)]
pub struct Parameters {
	pub command: Command,
	pub autostart: bool,
	pub stdout: String,
}

impl Parameters {
	pub fn new(yaml_params: &Yaml) -> Self {
		let command = Command::new(yaml_params["cmd"].as_str().unwrap_or_default());
		let autostart = yaml_params["autostart"].as_bool().unwrap_or_default();
		let stdout = String::from(yaml_params["stdout"].as_str().unwrap_or("/dev/null"));

		Parameters {
			command,
			autostart,
			stdout,
		}
	}
}

impl Parameters {
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
