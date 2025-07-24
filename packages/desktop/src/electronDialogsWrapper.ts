import type { AppDialogs, OpenDialogOptions, SaveDialogOptions } from '@supa/client/appDialogs';

// Extend the Window interface to include our exposed dialog APIs
declare global {
  interface Window {
    electronDialog: AppDialogs;
  }
}

export class ElectronDialogsWrapper implements AppDialogs {
  private get api() {
    if (!window.electronDialog) {
      throw new Error('electronDialog is not available. Ensure preload exposes it.');
    }
    return window.electronDialog;
  }

  async openDialog(opts: OpenDialogOptions): Promise<string | string[] | null> {
    return this.api.openDialog(opts);
  }

  async saveDialog(opts: SaveDialogOptions): Promise<string | null> {
    return this.api.saveDialog(opts);
  }
}

export const electronDialogsWrapper = new ElectronDialogsWrapper(); 