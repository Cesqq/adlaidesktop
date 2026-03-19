use crate::state::{ProcessMap, ProcessInfo, TrackedProcess};
use chrono::Utc;
use serde_json::json;
use std::process::Stdio;
use sysinfo::System;
use tokio::io::{AsyncBufReadExt, BufReader};

/// Execute a CLI command and stream stdout/stderr line-by-line through a Channel.
///
/// On Windows, commands are wrapped with `cmd /C` for proper PATH resolution
/// (critical for nvm/volta .cmd shims).
///
/// Each streamed line is a JSON object:
///   { "stream": "stdout"|"stderr", "line": "content", "timestamp": "ISO8601" }
///
/// Returns the process exit code.
#[tauri::command]
pub async fn run_command(
    command: String,
    args: Vec<String>,
    on_output: tauri::ipc::Channel<serde_json::Value>,
) -> Result<i32, String> {
    let mut cmd = build_command(&command, &args);
    cmd.stdout(Stdio::piped()).stderr(Stdio::piped());

    let mut child = cmd.spawn().map_err(|e| format!("Failed to spawn '{}': {}", command, e))?;

    let stdout = child.stdout.take().ok_or("Failed to capture stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to capture stderr")?;

    let on_output_clone = on_output.clone();

    // Spawn task for stdout
    let stdout_task = tokio::spawn(async move {
        let reader = BufReader::new(stdout);
        let mut lines = reader.lines();
        while let Ok(Some(line)) = lines.next_line().await {
            let _ = on_output.send(json!({
                "stream": "stdout",
                "line": line,
                "timestamp": Utc::now().to_rfc3339()
            }));
        }
    });

    // Spawn task for stderr
    let stderr_task = tokio::spawn(async move {
        let reader = BufReader::new(stderr);
        let mut lines = reader.lines();
        while let Ok(Some(line)) = lines.next_line().await {
            let _ = on_output_clone.send(json!({
                "stream": "stderr",
                "line": line,
                "timestamp": Utc::now().to_rfc3339()
            }));
        }
    });

    // Wait for the process to exit
    let status = child
        .wait()
        .await
        .map_err(|e| format!("Failed to wait on process: {}", e))?;

    // Wait for reader tasks to finish (they complete when streams close)
    let _ = stdout_task.await;
    let _ = stderr_task.await;

    Ok(status.code().unwrap_or(-1))
}

/// Start a process detached (fire-and-forget). Returns the PID immediately.
/// The process is tracked in ProcessMap so it can be killed later.
#[tauri::command]
pub async fn run_command_detached(
    command: String,
    args: Vec<String>,
    process_map: tauri::State<'_, ProcessMap>,
) -> Result<u32, String> {
    let mut cmd = build_command(&command, &args);
    // Don't pipe — let output go to null or inherit
    cmd.stdout(Stdio::null()).stderr(Stdio::null());

    let child = cmd.spawn().map_err(|e| format!("Failed to spawn '{}': {}", command, e))?;

    let pid = child.id().ok_or("Failed to get PID")?;

    let tracked = TrackedProcess {
        child,
        command: command.clone(),
        args: args.clone(),
        started_at: Utc::now().to_rfc3339(),
    };

    process_map.map.lock().await.insert(pid, tracked);

    Ok(pid)
}

/// Kill a process by PID. First checks our tracked processes, then falls back
/// to system-wide kill via sysinfo.
#[tauri::command]
pub async fn kill_process(
    pid: u32,
    process_map: tauri::State<'_, ProcessMap>,
) -> Result<(), String> {
    // Try our tracked processes first
    let mut map = process_map.map.lock().await;
    if let Some(mut tracked) = map.remove(&pid) {
        tracked
            .child
            .kill()
            .await
            .map_err(|e| format!("Failed to kill tracked process {}: {}", pid, e))?;
        return Ok(());
    }
    drop(map);

    // Fall back to system-wide kill
    let s = System::new_all();
    let sysinfo_pid = sysinfo::Pid::from_u32(pid);
    if let Some(process) = s.process(sysinfo_pid) {
        process.kill();
        Ok(())
    } else {
        Err(format!("Process {} not found", pid))
    }
}

/// List running processes that match the given filter names.
/// Searches system-wide using sysinfo. Names are matched case-insensitively.
///
/// If `filter_names` is empty, returns an empty list (not all processes).
#[tauri::command]
pub async fn list_running_processes(
    filter_names: Vec<String>,
) -> Result<Vec<ProcessInfo>, String> {
    if filter_names.is_empty() {
        return Ok(vec![]);
    }

    let mut sys = System::new();
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let lower_filters: Vec<String> = filter_names.iter().map(|n| n.to_lowercase()).collect();

    let results: Vec<ProcessInfo> = sys
        .processes()
        .iter()
        .filter_map(|(pid, process)| {
            let name = process.name().to_string_lossy().to_lowercase();
            if lower_filters.iter().any(|f| name.contains(f)) {
                Some(ProcessInfo {
                    pid: pid.as_u32(),
                    name: process.name().to_string_lossy().to_string(),
                    cpu_usage: process.cpu_usage(),
                    memory_bytes: process.memory(),
                })
            } else {
                None
            }
        })
        .collect();

    Ok(results)
}

/// Helper: build a tokio::process::Command with proper platform wrapping.
fn build_command(command: &str, args: &[String]) -> tokio::process::Command {
    if cfg!(target_os = "windows") {
        let mut cmd = tokio::process::Command::new("cmd");
        cmd.arg("/C").arg(command);
        for arg in args {
            cmd.arg(arg);
        }
        cmd
    } else {
        let mut cmd = tokio::process::Command::new(command);
        cmd.args(args);
        cmd
    }
}
