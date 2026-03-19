use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    Manager,
};

use crate::commands::system::TrayAgentInfo;

/// Initial tray setup with static menu. Called once from lib.rs .setup().
/// The menu is later updated dynamically via `rebuild_tray_menu`.
pub fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let show = MenuItem::with_id(app, "show", "Open Dashboard", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;

    TrayIconBuilder::with_id("main-tray")
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("Adl._.Ai Studio")
        .show_menu_on_left_click(false)
        .on_menu_event(handle_menu_event)
        .on_tray_icon_event(|tray, event| {
            if let tauri::tray::TrayIconEvent::Click {
                button: tauri::tray::MouseButton::Left,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}

/// Rebuild the tray menu with live agent status.
/// Called from the `update_tray_menu` Tauri command.
pub fn rebuild_tray_menu(
    app: &tauri::AppHandle,
    agents: &[TrayAgentInfo],
) -> Result<(), Box<dyn std::error::Error>> {
    let tray = app
        .tray_by_id("main-tray")
        .ok_or("Tray icon not found")?;

    // Build menu items
    let show = MenuItem::with_id(app, "show", "Open Dashboard", true, None::<&str>)?;
    let sep1 = PredefinedMenuItem::separator(app)?;

    let mut items: Vec<Box<dyn tauri::menu::IsMenuItem<tauri::Wry>>> = vec![
        Box::new(show),
        Box::new(sep1),
    ];

    // Per-agent status items
    for agent in agents {
        let label = if agent.status == "running" {
            if let Some(pid) = agent.pid {
                format!("{} — Running (PID: {})", agent.name, pid)
            } else {
                format!("{} — Running", agent.name)
            }
        } else {
            format!("{} — Stopped", agent.name)
        };

        let item = MenuItem::with_id(
            app,
            &format!("agent_{}", agent.name.to_lowercase().replace(' ', "_")),
            &label,
            false, // disabled — informational only
            None::<&str>,
        )?;
        items.push(Box::new(item));
    }

    let sep2 = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    items.push(Box::new(sep2));
    items.push(Box::new(quit));

    // Build menu from items
    let refs: Vec<&dyn tauri::menu::IsMenuItem<tauri::Wry>> =
        items.iter().map(|b| b.as_ref()).collect();
    let menu = Menu::with_items(app, &refs)?;
    tray.set_menu(Some(menu))?;

    // Update tooltip
    let running_count = agents.iter().filter(|a| a.status == "running").count();
    let tooltip = if running_count == 0 {
        "Adl._.Ai Studio — All agents stopped".to_string()
    } else {
        format!(
            "Adl._.Ai Studio — {} agent{} running",
            running_count,
            if running_count == 1 { "" } else { "s" }
        )
    };
    tray.set_tooltip(Some(&tooltip))?;

    Ok(())
}

/// Shared menu event handler for both initial and rebuilt menus.
fn handle_menu_event(app: &tauri::AppHandle, event: tauri::menu::MenuEvent) {
    match event.id.as_ref() {
        "show" => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        "quit" => {
            // Kill all tracked processes before exiting
            let process_map = app.state::<crate::state::ProcessMap>();
            let mut map = process_map.map.blocking_lock();
            for (_, mut tracked) in map.drain() {
                let _ = tracked.child.start_kill();
            }
            drop(map);
            app.exit(0);
        }
        _ => {}
    }
}
