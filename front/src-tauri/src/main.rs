// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

#[tauri::command]
async fn show_main_window(window: tauri::Window) {
    window.get_window("main").unwrap().show().unwrap();
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![show_main_window])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}