use crate::args::Args;
use std::error::Error;
use std::fs;

pub fn parse(args: Args) -> Result<(), Box<dyn Error>> {
	let contents = fs::read_to_string(args.filename)?;

	println!("With text:\n{}", contents);

	Ok(())
}
