use super::process::Process;
use std::collections::HashMap;
use std::error::Error;
use std::fs;
use std::fs::File;
use yaml_rust::YamlLoader;

#[derive(Debug)]
pub struct Config {
	pub log_file: fs::File,
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

		let log_file = match &doc["log_file"].as_str() {
			Some(value) => File::create(value)?,
			None => File::create("./logs")?,
		};

		let processes =
			doc["program"]
				.clone()
				.into_iter()
				.fold(HashMap::new(), |mut hm, process| {
					let name = process["name"].as_str().unwrap();
					let command = process["command"].as_str().unwrap();
					hm.insert(name.to_string(), Process::new(name, command));
					hm
				});

		Ok(Config {
			log_file,
			processes,
		})
	}
}
