use std::env;
use std::io::prelude::*;
use std::net::Shutdown;
use std::os::unix::net::{UnixListener, UnixStream};
use std::process;

use taskmaster::Cli;
use taskmaster::Config;
use taskmaster::SOCKET_PATH;

fn main() {
	std::fs::remove_file(SOCKET_PATH).unwrap();
	let listener = UnixListener::bind(SOCKET_PATH).unwrap_or_else(|err| {
		eprintln!("Problem binding socket: {}", err);
		process::exit(1);
	});

	match listener.accept() {
		Ok((mut socket, addr)) => {
			println!("Got a client: {:?} - {:?}", socket, addr);
			socket
				.write_all(b"hello from daemon")
				.unwrap_or_else(|err| {
					eprintln!("Problem writing msg: {}", err);
					process::exit(1);
				});
			// let mut response = String::new();
			// socket.read_to_string(&mut response).unwrap_or_else(|err| {
			// 	eprintln!("Problem reading msg: {}", err);
			// 	process::exit(1);
			// });
			// println!("client says: {}", response);
		}
		Err(e) => println!("accept function failed: {:?}", e),
	}

	// listener
	// 	.shutdown(Shutdown::Both)
	// 	.expect("shutdown function failed");

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

	println!("START DAEMON NOW");
}
