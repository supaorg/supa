import { writable } from 'svelte/store';

export const titleStore = writable<string>("");

export const appBarTitleStore = writable<string>("");