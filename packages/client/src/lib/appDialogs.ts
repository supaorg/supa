export interface OpenDialogOptions {
  title?: string;
  directory?: boolean;
  multiple?: boolean;
  filters?: { name: string; extensions: string[] }[];
}

export interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: { name: string; extensions: string[] }[];
}

export interface AppDialogs {
  openDialog(opts: OpenDialogOptions): Promise<string | string[] | null>;
  saveDialog(opts: SaveDialogOptions): Promise<string | null>;
} 