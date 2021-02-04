use std::process::Command;
use yaml_rust::Yaml;

#[derive(Debug)]
pub struct Parameters {
	pub command: Command,
	pub autostart: bool,
}

impl Parameters {
	pub fn new(yaml_params: &Yaml) -> Self {
		let command = Command::new(yaml_params["cmd"].as_str().unwrap_or_default());
		let autostart = yaml_params["autostart"].as_bool().unwrap_or_default();

		Parameters { command, autostart }
	}
}
