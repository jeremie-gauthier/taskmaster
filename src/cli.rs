use std::fmt::Debug;

#[derive(Debug)]
pub struct Cli {
	pub filename: String,
}

impl Cli {
	pub fn new(args: &[String]) -> Result<Cli, &'static str> {
		if args.len() != 2 {
			return Err("Print usage here");
		}

		let filename = args[1].clone();

		Ok(Cli { filename })
	}
}
