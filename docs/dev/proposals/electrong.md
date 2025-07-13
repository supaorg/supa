# Migration Spec: Transition from Tauri to Electron & Capacitor

## 1. Purpose

Provide a concise roadmap for replacing **Tauri** with **Electron** for desktop while laying a clear, future‑ready path for **Capacitor**‑based mobile apps. The plan assumes the project already uses **npm** and the monorepo layout shown below.

## 2. Current State Snapshot

* Root `package.json` orchestrates scripts that invoke **Tauri CLI** inside `packages/client`. fileciteturn0file0
* Packages:

  * `core/` – shared domain logic (unchanged)
  * `client/` – SvelteKit UI & front‑end logic (web build consumed by wrappers)
  * No dedicated desktop or mobile wrappers yet.

## 3. Target Folder Layout

```text
packages/
│ core/
│ client/           ← unchanged (web build output consumed by wrappers)
│ desktop/          ← new: Electron shell
│ mobile/           ← new: Capacitor workspace (added later)
```

## 4. Electron Desktop Wrapper (`packages/desktop`)

1. **Dependencies**

   ```bash
   npm i -D electron electron-builder electron-devtools-installer
   ```
2. **Entry points**

   * `main.ts`: create a `BrowserWindow`, load `../client/build/index.html` (dev: `http://localhost:5173`).
   * `preload.ts`: expose secure IPC helpers (`fs`, `path`) via `contextBridge`.
3. **IPC + fs contract**

   * Implement `readFile`, `writeFile`, etc. using Node `fs/promises`.
   * Expose them on `window.api` and keep them **Promise‑based** so the same calls work on Capacitor later.
4. **Root‑level scripts**

   ```json
   "scripts": {
     "dev": "concurrently -k \"npm:client:dev\" \"npm:desktop:dev\"",
     "client:dev": "npm --workspace packages/client run dev",
     "desktop:dev": "npm --workspace packages/desktop run electron-dev",

     "build": "npm run build:client && npm run build:desktop",
     "build:client": "npm --workspace packages/client run build",
     "build:desktop": "npm --workspace packages/desktop run electron-build"
   }
   ```

   *(Existing web‑only scripts stay intact.)*

## 5. Capacitor Mobile Wrapper (`packages/mobile`) – *stage 2*

1. Scaffold:

   ```bash
   npm create @capacitor/app@latest mobile
   ```
2. Configure `capacitor.config.ts`:

   ```ts
   export default {
     webDir: "../client/build",
     plugins: { /* later */ }
   };
   ```
3. Copy web assets on each build:

   ```bash
   npm --workspace packages/mobile run cap copy
   ```
4. Map the same fs helpers to Capacitor `Filesystem`.

## 6. Shared File‑System Interface

| Operation   | Electron (Node)         | Capacitor (Plugin)     |
| ----------- | ----------------------- | ---------------------- |
| `readFile`  | `fs.promises.readFile`  | `Filesystem.readFile`  |
| `writeFile` | `fs.promises.writeFile` | `Filesystem.writeFile` |

Export an abstract adapter from `core/fs.ts` and provide per‑platform implementations.

## 7. Dev Workflow

```bash
# Run Electron + Vite HMR together
npm run dev

# Web‑only (no Electron)
npm run dev:web
```

## 8. Build & Release

* **Desktop**: `npm run build` → electron‑builder outputs (`.dmg`, `.exe`, `.AppImage`).
* **Mobile (future)**: `npm --workspace packages/mobile run cap build ios|android`.

## 9. Out‑of‑Scope

* Code signing, auto‑updates, and store deployment.
* Internals of electron‑builder or Capacitor packaging.
