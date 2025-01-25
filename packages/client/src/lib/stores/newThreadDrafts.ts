import { persisted } from 'svelte-persisted-store';

// Store draft messages by app config ID
export const newThreadDrafts = persisted<Record<string, string>>("new-thread-drafts", {}); 