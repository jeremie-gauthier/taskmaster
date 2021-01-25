use crate::cli::Cli;
use std::error::Error;
use std::fs;
use std::process::Command;
use yaml_rust::YamlLoader;

pub fn parse(args: Cli) -> Result<(), Box<dyn Error>> {
	let contents = fs::read_to_string(args.filename)?;
	let yaml = YamlLoader::load_from_str(&contents).unwrap();
	let program = &yaml[0]["program"];
	let command = program["command"].as_str().unwrap();

	println!("With text:\n{:?}", command);

	// exec command with status()
	let mut list_dir = Command::new(command);
	if let Ok(mut child) = list_dir.spawn() {
		// child.wait().expect("command wasn't running");
		println!("Child has finished its execution!");
	} else {
		println!("ls command didn't start");
	}
	// list_dir.status().expect("failed to execute process");

	Ok(())
}
