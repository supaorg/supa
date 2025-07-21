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
  open(opts: OpenDialogOptions): Promise<string | string[] | null>;
  save(opts: SaveDialogOptions): Promise<string | null>;
} 