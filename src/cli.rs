use std::env;
use std::fmt::Debug;

#[derive(Debug)]
pub struct Cli {
	pub filename: String,
}

impl Cli {
	pub fn new(mut args: env::Args) -> Result<Cli, &'static str> {
		args.next();

		let filename = match args.next() {
			Some(arg) => arg,
			None => return Err("Print usage here"),
		};

		Ok(Cli { filename })
	}
}
