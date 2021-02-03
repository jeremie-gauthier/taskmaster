use std::io::prelude::*;
use std::os::unix::net::UnixListener;
use std::sync::{Arc, Mutex};
use std::{env, process, thread};

use taskmaster::Cli;
use taskmaster::Config;
use taskmaster::Daemon;
use taskmaster::SOCKET_PATH;

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

	let mut daemon = Daemon::new(config);
	daemon.listen(SOCKET_PATH).unwrap_or_else(|err| {
		eprintln!("Problem binding socket: {}", err);
		process::exit(1);
	});

	// std::fs::remove_file(SOCKET_PATH);
	// let listener = UnixListener::bind(SOCKET_PATH).unwrap_or_else(|err| {
	// 	eprintln!("Problem binding socket: {}", err);
	// 	process::exit(1);
	// });

	// let connections_limit = Arc::new(Mutex::new(0));

	// for stream in listener.incoming() {
	// 	println!("??> {:?}", stream);
	// 	if *connections_limit.lock().unwrap() >= 3 {
	// 		eprintln!("Too many threads running");
	// 		continue;
	// 	}
	// 	let connections_limit = Arc::clone(&connections_limit);

	// 	thread::spawn(move || {
	// 		*connections_limit.lock().unwrap() += 1;
	// 		println!("START: {}", *connections_limit.lock().unwrap());
	// 		let mut stream = stream.unwrap();
	// 		let reader = stream.try_clone().unwrap();
	// 		let reader = std::io::BufReader::new(reader);
	// 		for input in reader.lines() {
	// 			let input = input.unwrap();
	// 			println!("client said: {}", input);
	// 			writeln!(stream, "{}", input).unwrap();
	// 			stream.flush().unwrap();
	// 			eprintln!("daemon: responded");
	// 		}
	// 		*connections_limit.lock().unwrap() -= 1;
	// 		println!("END: {}", *connections_limit.lock().unwrap());
	// 	});
	// }
}
