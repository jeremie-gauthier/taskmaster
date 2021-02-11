use std::time::SystemTime;

#[derive(Debug)]
pub struct Time;

impl Time {
	pub fn now() -> SystemTime {
		SystemTime::now()
	}

	pub fn elapsed(time: SystemTime) -> String {
		let secs = time.elapsed().unwrap_or_default().as_secs();
		let hours = secs.div_euclid(3_600);
		let minutes = secs.div_euclid(60);
		let seconds = secs.rem_euclid(60);
		format!("{}:{:02}:{:02}", hours, minutes, seconds,)
	}
}
