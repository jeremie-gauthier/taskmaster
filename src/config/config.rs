use super::process::Process;
use std::collections::HashMap;
use std::fs::File;

pub struct Config {
	pub log_file: File,
	processes: HashMap<String, Process>,
}
