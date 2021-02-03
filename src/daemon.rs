use crate::shell::command::start::Start;
use crate::shell::command::utils::Command;
use crate::Config;
use crate::OUTPUT_DELIMITER;
use std::cmp::{max, min};
use std::error::Error;
use std::io::prelude::*;
use std::os::unix::net::UnixListener;
use std::sync::{Arc, Mutex};
use std::{fs, io, process};

pub struct Daemon {
	config: Arc<Mutex<Config>>,
	connections_limit: i8,
}

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

	pub fn listen(&mut self, path: &str) -> Result<(), Box<dyn Error>> {
		clear_unix_socket(&path);
		let listener = UnixListener::bind(&path)?;
		let connections_counter = Arc::new(Mutex::new(0));
		let acquire_counter = || match connections_counter.lock() {
			Ok(counter) => counter,
			Err(_) => process::exit(1),
		};
		let can_connect = || *acquire_counter() < self.connections_limit;
		let connect = || *acquire_counter() += 1;
		let disconnect = || *acquire_counter() -= 1;

		crossbeam::scope(|scope| {
			for stream in listener.incoming() {
				let mut stream = match stream {
					Ok(stream) => stream,
					Err(err) => {
						eprintln!("Stream error: {}", err);
						continue;
					}
				};

				if can_connect() {
					let config = Arc::clone(&self.config);

					scope.spawn(move |_| {
						connect();
						let reader = match stream.try_clone() {
							Ok(reader) => io::BufReader::new(reader),
							Err(err) => {
								disconnect();
								eprintln!("UnixStream error: {}", err);
								return;
							}
						};

						write!(stream, "Welcome to taskmaster{}", OUTPUT_DELIMITER)
							.unwrap_or_default();
						stream.flush().unwrap_or_default();

						for input in reader.lines() {
							match input {
								Ok(input) => {
									let response = dispatch(&input, &config);
									write!(stream, "{}{}", response, OUTPUT_DELIMITER)
										.unwrap_or_default();
									stream.flush().unwrap_or_default();
								}
								Err(err) => eprintln!("read error: {}", err),
							};
						}
						disconnect();
					});
				} else {
					eprintln!("Connection refused: Threads' limit reached");
					writeln!(
						stream,
						"Connection refused: Threads' limit reached\n \
						Increase the limit in your configuration file or shutdown a client{}",
						OUTPUT_DELIMITER
					)
					.unwrap_or_default();
					stream.flush().unwrap_or_default();
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
	let mut config = match config.lock() {
		Ok(config) => config,
		Err(err) => {
			eprintln!("Mutex error: {}", err);
			process::exit(1)
		}
	};
	let mut command = match cmd.as_ref() {
		"start" => Start::new(args, &mut config),
		_ => return format!("*** Unknown syntax: {}", input),
	};

	match command.parse_args() {
		Ok(()) => {
			let response = command.exec();
			match response {
				Ok(res) => res,
				Err(err) => format!("{}", err),
			}
		}
		Err(err) => format!("{}", err),
	}
}
