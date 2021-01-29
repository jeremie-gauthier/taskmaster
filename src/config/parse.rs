use crate::cli::Cli;
use std::collections::HashMap;
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
	println!("{:?}", yaml);
	let program = &yaml[0]["program"];

	// let xxx = program.clone().into_iter().map();
	// println!(">>> {:?}", xxx);
	// let xxx = YamlLoader::load_from_str(program.as_str().unwrap());
	// let xxx = YamlLoader::load_from_str(&contents).unwrap()[0].clone()
	// 	.into_iter()
	// 	.map(|pgr| {
	// 		println!(">>> {:?}", pgr);
	// 		pgr
	// 	})
	// 	.collect::<Vec<_>>();
	// println!(">>> | {:?}", xxx);
	// println!("{:?}\n", );
	// let foo = "hello";
	// let program = yaml[0]["program"].clone();
	let foo = program[0]["command"].as_str().unwrap();

	println!("With text:\n{:?}", foo);

	// exec command with status()
	let mut list_dir = Command::new(foo);
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
