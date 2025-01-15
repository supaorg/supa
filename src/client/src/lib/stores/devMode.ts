import { persisted, type Persisted } from 'svelte-persisted-store';

export const isDevMode = persisted("dev-mode", false);
export const spaceInspectorOpen = persisted("space-inspector-open", false);