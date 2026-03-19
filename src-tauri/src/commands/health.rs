use chrono::Utc;
use serde_json::json;
use std::time::{Duration, Instant};
use sysinfo::System;

/// Check the health of an agent framework.
///
/// If `port` is provided, performs an HTTP GET to `http://localhost:{port}/health`.
/// If no port, falls back to checking if a process matching `agent_name` is running.
#[tauri::command]
pub async fn check_agent_health(
    agent_name: String,
    port: Option<u16>,
) -> Result<serde_json::Value, String> {
    let checked_at = Utc::now().to_rfc3339();

    if let Some(p) = port {
        // HTTP health check
        let url = format!("http://localhost:{}/health", p);
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(3))
            .build()
            .map_err(|e| e.to_string())?;

        let start = Instant::now();
        match client.get(&url).send().await {
            Ok(resp) => {
                let elapsed_ms = start.elapsed().as_millis();
                let status_code = resp.status().as_u16();

                if resp.status().is_success() {
                    Ok(json!({
                        "agent": agent_name,
                        "status": "healthy",
                        "port": p,
                        "status_code": status_code,
                        "response_time_ms": elapsed_ms,
                        "pid": find_process_pid(&agent_name),
                        "checked_at": checked_at
                    }))
                } else {
                    Ok(json!({
                        "agent": agent_name,
                        "status": "unhealthy",
                        "port": p,
                        "status_code": status_code,
                        "response_time_ms": elapsed_ms,
                        "checked_at": checked_at
                    }))
                }
            }
            Err(e) => Ok(json!({
                "agent": agent_name,
                "status": "unreachable",
                "port": p,
                "error": e.to_string(),
                "checked_at": checked_at
            })),
        }
    } else {
        // Process-based health check (for agents like zeroclaw without HTTP)
        let pid = find_process_pid(&agent_name);
        if pid.is_some() {
            Ok(json!({
                "agent": agent_name,
                "status": "running",
                "pid": pid,
                "checked_at": checked_at
            }))
        } else {
            Ok(json!({
                "agent": agent_name,
                "status": "not_running",
                "checked_at": checked_at
            }))
        }
    }
}

/// Find a process PID by name (case-insensitive substring match).
fn find_process_pid(name: &str) -> Option<u32> {
    let mut sys = System::new();
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let lower_name = name.to_lowercase();
    sys.processes()
        .iter()
        .find(|(_, proc)| proc.name().to_string_lossy().to_lowercase().contains(&lower_name))
        .map(|(pid, _)| pid.as_u32())
}
