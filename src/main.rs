use std::env;
use std::process;

use taskmaster::Cli;
use taskmaster::Config;
use taskmaster::Shell;

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

	Shell::new(config).run().unwrap_or_else(|err| {
		eprintln!("Problem starting the shell: {}", err);
		process::exit(1);
	});
}
