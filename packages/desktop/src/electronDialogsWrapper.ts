import type { AppDialogs, OpenDialogOptions, SaveDialogOptions } from '@supa/client/appDialogs';

// Extend the Window interface to include our exposed dialog APIs
declare global {
  interface Window {
    electronDialog: {
      openDialog: (options: OpenDialogOptions) => Promise<string | string[] | null>;
      saveDialog: (options: SaveDialogOptions) => Promise<string | null>;
    };
  }
}

export class ElectronDialogsWrapper implements AppDialogs {
  private get api() {
    if (!window.electronDialog) {
      throw new Error('electronDialog is not available. Ensure preload exposes it.');
    }
    return window.electronDialog;
  }

  async open(opts: OpenDialogOptions): Promise<string | string[] | null> {
    return this.api.openDialog(opts);
  }

  async save(opts: SaveDialogOptions): Promise<string | null> {
    return this.api.saveDialog(opts);
  }
}

export const electronDialogsWrapper = new ElectronDialogsWrapper(); 