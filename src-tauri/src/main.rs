#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Fix para Linux: evita crash "Could not create default EGL display: EGL_BAD_PARAMETER"
    #[cfg(target_os = "linux")]
    {
        std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}