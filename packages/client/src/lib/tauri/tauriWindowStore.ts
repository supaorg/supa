import { persisted, type Persisted } from 'svelte-persisted-store';

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

export const tauriWindowStore: Persisted<TauriWindow | null> = persisted(
  'tauriWindow',
  null,
);