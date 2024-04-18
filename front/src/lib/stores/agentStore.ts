import type { Writable } from 'svelte/store';
import { get } from 'svelte/store';
import { localStorageStore } from '@skeletonlabs/skeleton';
import { client } from '$lib/tools/client';
import type { Agent } from '@shared/models';

export const agentStore: Writable<Agent[]> = localStorageStore('agents', []);

export async function createAgent() {
  // TODO: put info about the agent
  const agent = await client.post("agents").then((res) => {
    return res.data as Agent;
  });

  return agent;
}

export async function loadAgentsFromServer() {
    // @TODO: subsctibe to reconnect so we can re-fetch the threads
    
  const agents = await client.get("agents").then((res) => {
    const agents = res.data as Agent[];
    // sort by name
    agents.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
    return agents;
  });

  agentStore.set(agents);

  client.listen("agents", (broadcast) => {
    // TODO: implement
  });
}

