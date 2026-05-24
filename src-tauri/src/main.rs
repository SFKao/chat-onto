// Prevents an additional console window on Windows in release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Fix para Linux: algunos drivers (Mesa/ARM) fallan al inicializar EGL.
    // WEBKIT_DISABLE_COMPOSITING_MODE fuerza el modo de renderizado por software,
    // evitando el crash "Could not create default EGL display: EGL_BAD_PARAMETER".
    #[cfg(target_os = "linux")]
    {
        std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
    }

    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}