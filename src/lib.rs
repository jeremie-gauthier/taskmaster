extern crate crossbeam;
extern crate yaml_rust;

pub mod server;

pub use server::cli::Cli;
pub use server::config::config::Config;
pub use server::config::parse;
pub use server::daemon::Daemon;

pub mod client;
pub use client::shell;
pub use shell::shell::Shell;

pub static SOCKET_PATH: &'static str = "/tmp/taskmaster.sock";
pub static OUTPUT_DELIMITER: char = '#';
