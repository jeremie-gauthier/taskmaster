use std::env;
use std::process;

use taskmaster::shell;
use taskmaster::Cli;
use taskmaster::Config;

fn main() {
	let args = Cli::new(env::args()).unwrap_or_else(|err| {
		eprintln!("Problem parsing arguments: {}", err);
		process::exit(1);
	});
	// println!("{:?}", args);
	let config = Config::new(&args.filename).unwrap_or_else(|err| {
		eprintln!("Problem parsing config file: {}", err);
		process::exit(1);
	});
	// println!("CONFIG {:?}\n", config);

	shell(config).unwrap_or_else(|err| {
		eprintln!("Problem starting the shell: {}", err);
		process::exit(1);
	});
}
