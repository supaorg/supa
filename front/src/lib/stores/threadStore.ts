import type { Writable } from 'svelte/store';
import { localStorageStore } from '@skeletonlabs/skeleton';
import type { Thread } from '@shared/models';
import { client } from '$lib/tools/client';
import { apiRoutes } from '@shared/apiRoutes';
import { getCurrentWorkspaceId } from './workspaceStore';

export const threadsStore: Writable<Thread[]> = localStorageStore('threads', []);

export async function createThread(agentId: string) {
  const thread = await client.post(apiRoutes.threads(getCurrentWorkspaceId()), agentId).then((res) => {
    return res.data as Thread;
  });

  return thread;
}

export async function loadThreadsFromServer() {    
  const threads = await client.get(apiRoutes.threads(getCurrentWorkspaceId())).then((res) => {
    const threads = Array.isArray(res.data) ? res.data : [];
    // sort by createdAt
    threads.sort((a, b) => {
      return b.createdAt - a.createdAt;
    });
    return threads;
  });

  threadsStore.set(threads);

  client.on(apiRoutes.threads(getCurrentWorkspaceId()), (broadcast) => {
    if (broadcast.action === 'POST') {
      const thread = broadcast.data as Thread;
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
      const thread = broadcast.data as Thread;
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

