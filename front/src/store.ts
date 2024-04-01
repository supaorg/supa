import { writable } from 'svelte/store';

export const idToken = writable<string | null>(null);
export const user = writable<object | null>(null);
export const chatThreadId = writable<string | null>(null);