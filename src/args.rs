use std::fmt::Debug;

#[derive(Debug)]
pub struct Args {
	pub filename: String,
}

impl Args {
	pub fn new(args: &[String]) -> Result<Args, &'static str> {
		if args.len() < 2 {
			return Err("Nope");
		}

		let filename = args[1].clone();

		Ok(Args { filename })
	}
}
