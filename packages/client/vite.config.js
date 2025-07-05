import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from '@tailwindcss/vite';

const host = process.env.TAURI_DEV_HOST;

// Detect if we're running in Tauri mode
const isTauriMode = process.env.TAURI_PLATFORM !== undefined || process.env.TAURI_DEV_HOST !== undefined;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [tailwindcss(), sveltekit()],

  // Apply Tauri-specific configuration only when running in Tauri mode
  ...(isTauriMode && {
    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
  }),

  // Server configuration
  server: {
    port: 6969,
    strictPort: isTauriMode,
    host: host || false,
    ...(isTauriMode && {
      hmr: host
        ? {
            protocol: "ws",
            host,
            port: 6970, // HMR port should be different from main port
          }
        : undefined,
      watch: {
        // 3. tell vite to ignore watching `src-tauri`
        ignored: ["**/src-tauri/**"],
      },
    }),
  },
}));
