use serde::Deserialize;
use serde_json::json;
use sysinfo::System;

/// Detect the current operating system, architecture, and version.
#[tauri::command]
pub async fn detect_os() -> Result<serde_json::Value, String> {
    let os = std::env::consts::OS;
    let arch = std::env::consts::ARCH;
    let version = System::os_version().unwrap_or_else(|| "unknown".into());
    let hostname = System::host_name().unwrap_or_else(|| "unknown".into());

    Ok(json!({
        "os": os,
        "arch": arch,
        "version": version,
        "hostname": hostname
    }))
}

/// Check if a prerequisite CLI tool is installed and meets a minimum version.
///
/// `command` is the full check command, e.g. "node --version".
/// `expected_version` is the minimum version string, e.g. "18.0.0".
#[tauri::command]
pub async fn check_prerequisite(
    name: String,
    command: String,
    expected_version: Option<String>,
) -> Result<serde_json::Value, String> {
    let output = if cfg!(target_os = "windows") {
        tokio::process::Command::new("cmd")
            .args(["/C", &command])
            .output()
            .await
    } else {
        tokio::process::Command::new("sh")
            .args(["-c", &command])
            .output()
            .await
    };

    match output {
        Ok(out) => {
            if !out.status.success() && out.stdout.is_empty() {
                return Ok(json!({
                    "name": name,
                    "installed": false,
                    "version": null,
                    "meets_requirement": false,
                    "error": String::from_utf8_lossy(&out.stderr).trim().to_string()
                }));
            }

            let stdout = String::from_utf8_lossy(&out.stdout).trim().to_string();
            let version = extract_version(&stdout);

            let meets_requirement = match (&version, &expected_version) {
                (Some(current), Some(expected)) => compare_versions(current, expected),
                _ => false,
            };

            Ok(json!({
                "name": name,
                "installed": true,
                "version": version,
                "meets_requirement": meets_requirement
            }))
        }
        Err(e) => Ok(json!({
            "name": name,
            "installed": false,
            "version": null,
            "meets_requirement": false,
            "error": e.to_string()
        })),
    }
}

/// Extract a version string (e.g. "18.17.1") from command output.
/// Strips leading 'v' and takes the first token that looks like a version.
fn extract_version(output: &str) -> Option<String> {
    for token in output.split_whitespace() {
        let cleaned = token.trim_start_matches('v');
        let parts: Vec<&str> = cleaned.split('.').collect();
        if parts.len() >= 2 && parts.iter().all(|p| p.parse::<u64>().is_ok()) {
            return Some(cleaned.to_string());
        }
    }
    None
}

/// Compare two semver-like version strings (e.g. "18.17.1" >= "18.0.0").
/// Returns true if `current` >= `expected`.
fn compare_versions(current: &str, expected: &str) -> bool {
    let parse = |s: &str| -> Vec<u64> {
        s.split('.')
            .filter_map(|p| p.parse::<u64>().ok())
            .collect()
    };

    let cur = parse(current);
    let exp = parse(expected);

    for i in 0..exp.len().max(cur.len()) {
        let c = cur.get(i).copied().unwrap_or(0);
        let e = exp.get(i).copied().unwrap_or(0);
        if c > e {
            return true;
        }
        if c < e {
            return false;
        }
    }
    true // equal
}

// ---------------------------------------------------------------------------
// Tray menu update (called by frontend after each health poll)
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
pub struct TrayAgentInfo {
    pub name: String,
    pub status: String,
    pub pid: Option<u32>,
}

/// Update the system tray menu and tooltip based on current agent status.
/// Called by the frontend health polling hook.
#[tauri::command]
pub async fn update_tray_menu(
    app: tauri::AppHandle,
    agents: Vec<TrayAgentInfo>,
) -> Result<(), String> {
    crate::tray::rebuild_tray_menu(&app, &agents).map_err(|e| e.to_string())
}
