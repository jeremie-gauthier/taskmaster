use crate::server::process::parameters::Parameters;
use crate::server::process::process::Process;
use std::collections::hash_map::IterMut;
use std::collections::HashMap;
use std::error::Error;
use std::fs;
use std::fs::File;
use yaml_rust::YamlLoader;

#[derive(Debug)]
pub struct Config {
	pub log_file: File,
	processes: HashMap<String, Process>,
}

impl Config {
	pub fn new(config_filename: &str) -> Result<Self, Box<dyn Error>> {
		Config::parse(config_filename)
	}

	fn parse(config_filename: &str) -> Result<Self, Box<dyn Error>> {
		let config_content = fs::read_to_string(config_filename)?;
		let docs = YamlLoader::load_from_str(&config_content)?;
		let doc = &docs[0];

		let processes: HashMap<String, Process> = match &doc["programs"].as_hash() {
			Some(programs) => programs.into_iter().fold(
				HashMap::new(),
				|mut hm, (program_name, program_config)| {
					if let Some(name) = program_name.as_str() {
						let parameters = Parameters::new(program_config);
						hm.insert(name.to_string(), Process::new(name, parameters));
					} else {
						eprintln!("[-] Malformated program name. Skipping.");
					}
					hm
				},
			),
			None => HashMap::new(),
		};

		let log_file = match &doc["log_file"].as_str() {
			Some(value) => File::create(value)?,
			None => File::create("./logs")?,
		};

		Ok(Config {
			log_file,
			processes,
		})
	}

	pub fn process(&self, process_name: &str) -> Result<&Process, Box<dyn Error>> {
		match self.processes.get(process_name) {
			Some(process) => Ok(process),
			None => Err(format!("{}: ERROR (no such process)", process_name))?,
		}
	}

	pub fn process_mut(&mut self, process_name: &str) -> Result<&mut Process, Box<dyn Error>> {
		match self.processes.get_mut(process_name) {
			Some(process) => Ok(process),
			None => Err(format!("{}: ERROR (no such process)", process_name))?,
		}
	}

	pub fn processes_mut(&mut self) -> Result<IterMut<String, Process>, Box<dyn Error>> {
		Ok(self.processes.iter_mut())
	}
}
