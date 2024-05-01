import type { Writable } from 'svelte/store';
import { localStorageStore } from '@skeletonlabs/skeleton';
import { client } from '$lib/tools/client';
import type { AgentConfig } from '@shared/models';

export const agentConfigStore: Writable<AgentConfig[]> = localStorageStore('agent-configs', []);

export async function createAgent() {
  // TODO: put info about the agent
  const agent = await client.post("agents").then((res) => {
    return res.data as AgentConfig;
  });

  return agent;
}

export async function loadAgentsFromServer() {
    // @TODO: subsctibe to reconnect so we can re-fetch the threads
    
  const agents = await client.get("agent-configs").then((res) => {
    const agents = Array.isArray(res.data) ? res.data as AgentConfig[] : [];
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

  agentConfigStore.set(agents);

  client.listen("agent-configs", (broadcast) => {
    // TODO: implement
  });
}

