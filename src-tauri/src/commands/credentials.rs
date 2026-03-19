use serde_json::json;
use tauri_plugin_store::StoreExt;

const SERVICE_NAME: &str = "adlai-studio";
const STORE_FILE: &str = "credentials-registry.json";
const STORE_KEY: &str = "keys";

/// Store a credential in the OS keychain and register the key name.
#[tauri::command]
pub async fn set_credential(
    app: tauri::AppHandle,
    key: String,
    value: String,
) -> Result<(), String> {
    // Store in OS keychain
    let entry = keyring::Entry::new(SERVICE_NAME, &key).map_err(|e| e.to_string())?;
    entry.set_password(&value).map_err(|e| e.to_string())?;

    // Register key name in the store for list_credentials
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    let mut keys = get_key_list(&store);
    if !keys.contains(&key) {
        keys.push(key);
        store.set(STORE_KEY, json!(keys));
        store.save().map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Retrieve a credential from the OS keychain.
/// Returns None if the key doesn't exist.
#[tauri::command]
pub async fn get_credential(key: String) -> Result<Option<String>, String> {
    let entry = keyring::Entry::new(SERVICE_NAME, &key).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(password) => Ok(Some(password)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

/// Delete a credential from the OS keychain and unregister the key name.
#[tauri::command]
pub async fn delete_credential(app: tauri::AppHandle, key: String) -> Result<(), String> {
    // Delete from OS keychain (ignore NoEntry — idempotent delete)
    let entry = keyring::Entry::new(SERVICE_NAME, &key).map_err(|e| e.to_string())?;
    match entry.delete_credential() {
        Ok(()) => {}
        Err(keyring::Error::NoEntry) => {}
        Err(e) => return Err(e.to_string()),
    }

    // Remove key name from store
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    let mut keys = get_key_list(&store);
    keys.retain(|k| k != &key);
    store.set(STORE_KEY, json!(keys));
    store.save().map_err(|e| e.to_string())?;

    Ok(())
}

/// List all registered credential key names (not the secret values).
#[tauri::command]
pub async fn list_credentials(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let store = app.store(STORE_FILE).map_err(|e| e.to_string())?;
    Ok(get_key_list(&store))
}

/// Helper: read the key name list from the store.
fn get_key_list(store: &tauri_plugin_store::Store<tauri::Wry>) -> Vec<String> {
    store
        .get(STORE_KEY)
        .and_then(|v| serde_json::from_value::<Vec<String>>(v.clone()).ok())
        .unwrap_or_default()
}
