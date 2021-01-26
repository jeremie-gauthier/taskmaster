use std::env;
use std::process;

use taskmaster::cli::Cli;
use taskmaster::config::parse::parse;

fn main() {
	let env_args: Vec<String> = env::args().collect();
	let args = Cli::new(&env_args).unwrap_or_else(|err| {
		eprintln!("Problem parsing arguments: {}", err);
		process::exit(1);
	});
	println!("{:?}", args);
	parse(args).unwrap_or_else(|err| {
		eprintln!("Problem while opening file: {}", err);
		process::exit(1);
	});
}
