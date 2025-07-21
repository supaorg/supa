# Cross-Platform Dialog Abstraction

## Motivation
We previously abstracted file-system access behind the `AppFileSystem` interface so that the **client** layer can stay agnostic of the underlying runtime (Electron, Tauri, Capacitor, etc.).  Dialogs (question / confirmation boxes and file-picker dialogs) are currently used directly from Tauri APIs and are commented out while switching to Electron.  A thin, typed abstraction will let us:

* keep component code identical across runtimes;
* unit-test dialog interactions in isolation;
* plug new environments (e.g. Capacitor) by providing only an adapter.

## High-Level Design

### 1. `AppDialogs` interface (shared package)
We start with the **minimum viable surface** – file/folder pickers and save dialogs.  Other helpers (message / confirmation boxes) can be added later without breaking consumers.

```ts
// packages/client/src/lib/appDialogs.ts
export interface OpenDialogOptions {
  title?: string;
  directory?: boolean;               // pick folder instead of file
  multiple?: boolean;                // allow multi-select
  filters?: { name: string; extensions: string[] }[];
}

export interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: { name: string; extensions: string[] }[];
}

export interface AppDialogs {
  /**
   * Opens a native picker and returns the selected path(s) or `null` if the user cancelled.
   */
  open(opts: OpenDialogOptions): Promise<string | string[] | null>;

  /**
   * Opens a native save dialog and returns the chosen path or `null` if the user cancelled.
   */
  save(opts: SaveDialogOptions): Promise<string | null>;
}
```

### 2. Runtime adapters
* **Electron** (`packages/desktop/src/electronDialogsWrapper.ts`)
  * Wraps `ipcRenderer.invoke` helpers that proxy to Electron `dialog.showOpenDialog` / `showSaveDialog` in the main process.
* **Tauri** (`packages/tauri/src/tauriDialogsWrapper.ts` – kept for reference)
  * Wraps `@tauri-apps/plugin-dialog` functions (`open`, `save`).
* **Capacitor / Web** – future adapters with matching signatures.

### 3. Dependency injection
Extend `ClientStateConfig` and add a matching accessor inside `ClientState` (mirrors the existing `fs` pattern):
```ts
export type ClientStateConfig = {
  fs?: AppFileSystem;
  dialog?: AppDialogs;   // NEW
}

class ClientState {
  private _dialog: AppDialogs | null = null;

  get dialog(): AppDialogs {
    if (!this._dialog) throw new Error("dialog is not set");
    return this._dialog;
  }

  async init(initState: ClientStateConfig) {
    this._dialog = initState.dialog || null;
    // ...existing logic
  }
}
```
The entry point for each runtime (e.g. `packages/desktop/src/routes/+page.svelte`) injects its adapter:
```ts
config = {
  fs: electronFsWrapper,
  dialog: electronDialogsWrapper
};
```

### 4. Usage in components
Instead of importing Tauri/Electron APIs directly, UI code receives a dialogs instance, e.g. via:

```ts
import { clientState } from "@supa/client/state/clientState.svelte";

const chosenDir = await clientState.dialog.open({ directory: true });
if (chosenDir) {
  // ...
}

```
This keeps Svelte components runtime-agnostic.

## Migration Plan
1. **Create** `packages/client/src/lib/appDialogs.ts` with the interface above.
2. **Implement** `electronDialogsWrapper` that forwards to Electron dialog APIs via IPC.
3. **Refactor** components (`SpaceOpener`, etc.) to use `clientState.config.dialogs`.
4. **(Optional)** Re-enable Tauri implementation for the desktop build.
5. **Add** unit tests with mocked `AppDialogs`.

## Future Work
* Add specialized helpers (e.g. `selectDirectory`, `error` shortcut).
* Support mobile (Capacitor) file-pickers and platform permission prompts.

---
_Outcome_: a pluggable, typed dialog layer mirroring our fs abstraction, enabling painless switches between Electron, Tauri, Capacitor and future runtimes. 