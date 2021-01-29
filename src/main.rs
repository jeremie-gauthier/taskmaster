use std::env;
use std::process;

use taskmaster::cli::Cli;
use taskmaster::config::config::Config;

fn main() {
	let args = Cli::new(env::args()).unwrap_or_else(|err| {
		eprintln!("Problem parsing arguments: {}", err);
		process::exit(1);
	});
	println!("{:?}", args);
	let config = Config::new(&args.filename).unwrap_or_else(|err| {
		eprintln!("Problem parsing config file: {}", err);
		process::exit(1);
	});
	println!("CONFIG {:?}", config);
}
