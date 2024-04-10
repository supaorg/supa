import type { Writable } from 'svelte/store';
import { get } from 'svelte/store';
import { localStorageStore } from '@skeletonlabs/skeleton';
import type { ChatThread } from '@shared/models';
import { client } from '$lib/tools/client';

export const threadsStore: Writable<ChatThread[]> = localStorageStore('threads', []);

export async function createThread(agentId: string) {
  const thread = await client.post("threads", agentId).then((res) => {
    return res.data as ChatThread;
  });

  return thread;
}

/**
 * Load threads from the server.
 * **Important**: Call this after getting the user authorized and read to fetch theri content
 */
export async function loadThreadsFromServer() {
    // @TODO: subsctibe to reconnect so we can re-fetch the threads
    
  const threads = await client.get("threads").then((res) => {
    const threads = res.data as ChatThread[];
    // sort by createdAt
    threads.sort((a, b) => {
      return b.createdAt - a.createdAt;
    });
    return threads;
  });

  threadsStore.set(threads);

  client.listen("threads", (broadcast) => {
    if (broadcast.action === 'POST') {
      const thread = broadcast.data as ChatThread;
      threadsStore.update((threads) => { 
        return [thread, ...threads];
      });
    } else if (broadcast.action === 'DELETE') {
      const threadId = broadcast.data as string;
      threadsStore.update((threads) => {
        const newThreads = threads.filter((t) => t.id !== threadId);
        return newThreads;
      });
    } else if (broadcast.action === 'UPDATE') {
      const thread = broadcast.data as ChatThread;
      threadsStore.update((threads) => {
        const newThreads = threads.map((t) => {
          if (t.id === thread.id) {
            return thread;
          }
          return t;
        });
        return newThreads;
      });
    }
  });
}

