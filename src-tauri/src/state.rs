use serde::Serialize;
use std::collections::HashMap;
use tokio::process::Child;

/// General application state. Wrapped in std::sync::Mutex for Tauri's manage().
/// Lock times are short (field reads/writes), so std::sync::Mutex is appropriate.
#[derive(Default)]
#[allow(dead_code)]
pub struct AppStateInner {
    pub initialized: bool,
}

/// Tracks running child processes spawned by run_command_detached.
/// Uses tokio::sync::Mutex because Child::kill() is async and we need
/// to hold the lock across .await points in kill_process.
pub struct ProcessMap {
    pub map: tokio::sync::Mutex<HashMap<u32, TrackedProcess>>,
}

impl Default for ProcessMap {
    fn default() -> Self {
        Self {
            map: tokio::sync::Mutex::new(HashMap::new()),
        }
    }
}

/// A tracked child process with metadata.
#[allow(dead_code)]
pub struct TrackedProcess {
    pub child: Child,
    pub command: String,
    pub args: Vec<String>,
    pub started_at: String,
}

/// Serializable process info returned to the frontend.
#[derive(Clone, Serialize)]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub cpu_usage: f32,
    pub memory_bytes: u64,
}
