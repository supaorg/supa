import { persisted } from 'svelte-persisted-store';

// Store draft messages by thread ID
export const draftMessages = persisted<Record<string, string>>("draft-messages", {}); 