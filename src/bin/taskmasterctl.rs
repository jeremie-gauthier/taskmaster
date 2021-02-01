use std::os::unix::net::UnixStream;
use std::process;

use taskmaster::Shell;
use taskmaster::SOCKET_PATH;

fn main() {
	let stream = UnixStream::connect(SOCKET_PATH).unwrap_or_else(|err| {
		eprintln!("Cannot connect to socket: {}", err);
		process::exit(1);
	});

	// stream
	// 	.write_all(b"hello from control program")
	// 	.unwrap_or_else(|err| {
	// 		eprintln!("Error while sending msg: {}", err);
	// 		process::exit(1);
	// 	});

	// let mut response = String::new();
	// stream.read_to_string(&mut response).unwrap_or_else(|err| {
	// 	eprintln!("Error while receiving msg: {}", err);
	// 	process::exit(1);
	// });
	// println!("Server says: {}", response);

	Shell::new(stream).run().unwrap_or_else(|err| {
		eprintln!("Problem starting the shell: {}", err);
		process::exit(1);
	});
}
