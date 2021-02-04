extern crate crossbeam;
extern crate yaml_rust;

pub mod cli;
pub use cli::Cli;

pub mod config;
pub use config::config::Config;
pub use config::parse;

pub mod shell;
pub use shell::shell::Shell;

pub mod daemon;
pub use daemon::Daemon;

pub static SOCKET_PATH: &'static str = "/tmp/taskmaster.sock";
pub static OUTPUT_DELIMITER: char = '#';
