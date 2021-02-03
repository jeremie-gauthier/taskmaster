use std::os::unix::net::UnixStream;
use std::process;

use taskmaster::Shell;
use taskmaster::SOCKET_PATH;

fn main() {
	let stream = UnixStream::connect(SOCKET_PATH).unwrap_or_else(|err| {
		eprintln!("Cannot connect to socket: {}", err);
		process::exit(1);
	});

	Shell::new(stream).run().unwrap_or_else(|err| {
		eprintln!("{}", err);
		process::exit(1);
	});
}
