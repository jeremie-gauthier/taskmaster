use std::env;
use std::process;

use taskmaster::args::Args;
use taskmaster::config::parse::parse;

fn main() {
	let env_args: Vec<String> = env::args().collect();
	let args = Args::new(&env_args).unwrap_or_else(|err| {
		println!("Problem parsing arguments: {}", err);
		process::exit(1);
	});
	println!("{:?}", args);
	parse(args).unwrap_or_else(|err| {
		println!("Problem while opening file: {}", err);
		process::exit(1);
	});
}
