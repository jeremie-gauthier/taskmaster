use crate::shell::command::utils::Command;
use crate::Config;
use std::error::Error;
use std::str::SplitAsciiWhitespace;

const STOP_USAGE: &'static str =
"stop <name>\t\tStop a process\nstop <name> <name>\t\tStop multiple processes\nstop all\t\tStop all processes";

pub struct Stop<'a> {
	args: SplitAsciiWhitespace<'a>,
	config: &'a mut Config,
	process_names: Option<Vec<&'a str>>,
	all_option: bool,
}

impl<'a> Stop<'a> {
	pub const CMD_NAME: &'a str = "stop";
}
