mod commands;
mod state;
mod tray;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_store::Builder::new().build())
        .manage(std::sync::Mutex::new(state::AppStateInner::default()))
        .manage(state::ProcessMap::default())
        .invoke_handler(tauri::generate_handler![
            // System detection
            commands::system::detect_os,
            commands::system::check_prerequisite,
            // Credential management (OS keychain)
            commands::credentials::get_credential,
            commands::credentials::set_credential,
            commands::credentials::delete_credential,
            commands::credentials::list_credentials,
            // CLI execution
            commands::cli::run_command,
            commands::cli::run_command_detached,
            commands::cli::kill_process,
            commands::cli::list_running_processes,
            // Agent health checks
            commands::health::check_agent_health,
            // Tray updates
            commands::system::update_tray_menu,
        ])
        .setup(|app| {
            tray::setup_tray(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
