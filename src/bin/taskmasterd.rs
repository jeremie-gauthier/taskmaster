use std::io::prelude::*;
use std::os::unix::net::UnixListener;
use std::{env, process, thread};

use taskmaster::Cli;
use taskmaster::Config;
use taskmaster::SOCKET_PATH;

fn main() {
	let args = Cli::new(env::args()).unwrap_or_else(|err| {
		eprintln!("Problem parsing arguments: {}", err);
		process::exit(1);
	});
	// println!("{:?}", args);
	let _config = Config::new(&args.filename).unwrap_or_else(|err| {
		eprintln!("Problem parsing config file: {}", err);
		process::exit(1);
	});
	// println!("CONFIG {:?}\n", config);

	std::fs::remove_file(SOCKET_PATH).unwrap();
	let listener = UnixListener::bind(SOCKET_PATH).unwrap_or_else(|err| {
		eprintln!("Problem binding socket: {}", err);
		process::exit(1);
	});

	for stream in listener.incoming() {
		println!("??> {:?}", stream);
		match stream {
			Ok(mut stream) => {
				/* connection succeeded */
				thread::spawn(move || {
					println!("Ready to read");
					let mut input = String::new();
					stream.read_to_string(&mut input).expect("read fails");
					println!("client said: {}", input);
					stream.write_all(b"Got it bro").expect("write fails");
				});
			}
			Err(err) => {
				eprintln!("ERROR incoming stream: {}", err);
				break;
			}
		}
	}
	// match listener.accept() {
	// 	Ok((mut socket, addr)) => {
	// 		println!("Got a client: {:?} - {:?}", socket, addr);
	// socket
	// 	.write_all(b"hello from daemon")
	// 	.unwrap_or_else(|err| {
	// 		eprintln!("Problem writing msg: {}", err);
	// 		process::exit(1);
	// 	});
	// 		// let mut response = String::new();
	// 		// socket.read_to_string(&mut response).unwrap_or_else(|err| {
	// 		// 	eprintln!("Problem reading msg: {}", err);
	// 		// 	process::exit(1);
	// 		// });
	// 		// println!("client says: {}", response);
	// 	}
	// 	Err(e) => println!("accept function failed: {:?}", e),
	// }
}
