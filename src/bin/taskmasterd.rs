use std::{env, process};

use taskmaster::Cli;
use taskmaster::Config;
use taskmaster::Daemon;
use taskmaster::SOCKET_PATH;

fn main() {
	let args = Cli::new(env::args()).unwrap_or_else(|err| {
		eprintln!("Problem parsing arguments: {}", err);
		process::exit(1);
	});
	let config = Config::new(&args.filename).unwrap_or_else(|err| {
		eprintln!("Problem parsing config file: {}", err);
		process::exit(1);
	});
	println!("{:#?}", config);

	let mut daemon = Daemon::new(config);
	daemon.listen(SOCKET_PATH).unwrap_or_else(|err| {
		eprintln!("Problem binding socket: {}", err);
		process::exit(1);
	});
}
