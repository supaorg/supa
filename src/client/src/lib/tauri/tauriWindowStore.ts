import type { Writable } from 'svelte/store';
import { writable } from 'svelte/store';

export type TauriWindow = {
  monitorName: string;
  monitorScaleFactor: number;
  monitorWidth: number;
  monitorHeight: number;
  monitorPositionX: number;
  monitorPositionY: number;

  windowIsFullScreen: boolean;
  windowWidth: number;
  windowHeight: number;
  windowPositionX: number;
  windowPositionY: number;
}

// export const tauriWindowStore: Writable<TauriWindow | null> = localStorageStore('tauriWindow', null);
export const tauriWindowStore: Writable<TauriWindow | null> = writable(null);