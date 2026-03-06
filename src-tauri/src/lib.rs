use tauri_plugin_shell::ShellExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      // Spawn the FastAPI backend sidecar
      let _sidecar = app
        .shell()
        .sidecar("kokpit-backend")
        .expect("failed to find kokpit-backend sidecar")
        .spawn()
        .expect("failed to spawn kokpit-backend");
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}