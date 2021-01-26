use crate::cli::Cli;
use std::error::Error;
use std::fs;
use std::process::{Command, Stdio};
use yaml_rust::YamlLoader;

pub fn parse(args: Cli) -> Result<(), Box<dyn Error>> {
	let contents = fs::read_to_string(&args.filename)?;
	// access the config file metadata
	// the modified() function give us the last time file was modified
	// this can help to detect when to trigger SIGHUP to reload the config
	let attr = fs::metadata(&args.filename)?;
	println!("\n{:?}\n", attr.modified());

	let yaml = YamlLoader::load_from_str(&contents).unwrap();
	let program = &yaml[0]["program"];
	let command = program["command"].as_str().unwrap();

	println!("With text:\n{:?}", command);

	// exec command with status()
	let mut list_dir = Command::new(command);
	// set stdout to /dev/null to silent process' output
	// don't forget to redirect stderr too
	list_dir.stdout(Stdio::null());
	let status = list_dir.status();
	println!("{:?}", status);

	// set stdout to the parent's one to see output
	list_dir.stdout(Stdio::inherit());
	let status = list_dir.status();
	println!("{:?}", status);

	Ok(())
}
