use crate::shell::command::start::Start;
use crate::shell::command::utils::Command;
use crate::Config;
use std::cmp::{max, min};
use std::error::Error;
use std::io::prelude::*;
use std::os::unix::net::UnixListener;
use std::os::unix::net::UnixStream;
use std::sync::{Arc, Mutex};
use std::{fs, io, thread};

// #[derive(Copy)]
pub struct Daemon {
	config: Arc<Mutex<Config>>,
	connections_limit: i8,
}

// impl Copy for Daemon {}

impl Daemon {
	pub fn new(config: Config) -> Self {
		Daemon {
			config: Arc::new(Mutex::new(config)),
			connections_limit: 3,
		}
	}

	pub fn set_connections_limit(&mut self, connections_limit: i8) {
		self.connections_limit = max(min(3, connections_limit), 1);
	}

	// fn can_connect(&mut self) -> bool {
	// 	*self.connections_counter.lock().unwrap() < self.connections_limit
	// }

	// pub fn config_mut(&mut self) {
	// 	self.config.as_mut()
	// }

	// fn handle_connection(&mut self, mut stream: UnixStream) {
	// 	let connections_counter = Arc::clone(&self.connections_counter);
	// 	thread::spawn(move || {
	// 		*connections_counter.lock().unwrap() += 1;
	// 		// println!("START: {}", *connections_counter.lock().unwrap());
	// 		let reader = stream.try_clone().unwrap();
	// 		let reader = io::BufReader::new(reader);
	// 		for input in reader.lines() {
	// 			let input = input.unwrap();
	// 			dispatch(&input, &mut self.config);
	// 			// println!("client said: {}", input);
	// 			writeln!(stream, "{}", input).unwrap();
	// 			stream.flush().unwrap();
	// 			// eprintln!("daemon: responded");
	// 		}
	// 		*connections_counter.lock().unwrap() -= 1;
	// 		// println!("END: {}", *connections_counter.lock().unwrap());
	// 	});
	// }
	pub fn listen(&mut self, path: &str) -> Result<(), Box<dyn Error>> {
		clear_unix_socket(&path);
		let listener = UnixListener::bind(&path)?;
		let connections_counter = Arc::new(Mutex::new(0));
		// let config_mutex = Arc::new(Mutex::new(config));
		let can_connect = || *connections_counter.lock().unwrap() < self.connections_limit;

		crossbeam::scope(|scope| {
			for stream in listener.incoming() {
				println!("??> {:?}", stream);

				if can_connect() {
					let mut stream = stream.unwrap();
					let connections_counter = Arc::clone(&connections_counter);
					let config = Arc::clone(&self.config);
					// let local_self = self.clone();
					scope.spawn(move |_| {
						*connections_counter.lock().unwrap() += 1;
						// println!("START: {}", *connections_counter.lock().unwrap());
						let reader = stream.try_clone().unwrap();
						let reader = io::BufReader::new(reader);
						for input in reader.lines() {
							let input = input.unwrap();
							// println!("client said: {}", input);
							let res = dispatch(&input, &config);
							// println!("I answer with: {}", res);
							writeln!(stream, "{}", res).unwrap();
							stream.flush().unwrap();
							// eprintln!("daemon: responded");
						}
						*connections_counter.lock().unwrap() -= 1;
						// println!("END: {}", *connections_counter.lock().unwrap());
					});
				} else {
					// send err msg to client
					eprintln!("Too many threads running");
				}
			}
		})
		.unwrap();
		Ok(())
	}
}

fn clear_unix_socket(path: &str) {
	fs::remove_file(path).unwrap_or_else(|_| ());
}

fn dispatch(input: &str, config: &Arc<Mutex<Config>>) -> String {
	let mut tokens = input.split_ascii_whitespace();
	let (cmd, args) = match tokens.next() {
		Some(cmd) => (cmd.to_ascii_lowercase(), tokens),
		None => return String::from(""),
	};
	let mut config = config.lock().unwrap();
	let mut command = match cmd.as_ref() {
		"start" => Start::new(args, &mut config),
		_ => return format!("*** Unknown syntax: {}", input),
	};
	command.parse_args();
	let response = command.exec();
	match response {
		Ok(res) => res,
		Err(err) => format!("{}", err),
	}
}
