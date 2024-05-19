import { get, type Writable, writable } from "svelte/store";
import { localStorageStore } from "@skeletonlabs/skeleton";
import { client } from "$lib/tools/client";
import type { AgentConfig } from "@shared/models";
import { routes } from "@shared/routes/routes";

export const agentConfigStore: Writable<AgentConfig[]> = localStorageStore(
  routes.agentConfigs,
  [],
);

export const visibleAgentConfigStore = writable<AgentConfig[]>([]);

agentConfigStore.subscribe((agents) => {
  const visibleAgents = agents.filter((a) => {
    if (a.meta && a.meta.visible === "false") {
      return false;
    }
    return true;
  });
  visibleAgentConfigStore.set(visibleAgents);
});

export async function createAgent() {
  const agent = await client.post(routes.agentConfigs).then((res) => {
    return res.data as AgentConfig;
  });

  return agent;
}

export async function loadAgentsFromServer() {
  const agents = await client.get(routes.agentConfigs).then((res) => {
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

  client.listen(routes.agentConfigs, (broadcast) => {
    if (broadcast.action === "POST" || broadcast.action === "UPDATE") {
      const config = broadcast.data as AgentConfig;

      agentConfigStore.update((agents) => {
        // Check if we need to update or add the config
        const index = agents.findIndex((c) => c.id === config.id);
        if (index === -1) {
          agents.push(config);
        } else {
          agents[index] = config;
        }

        return agents;
      });
    } else if (broadcast.action === "DELETE") {
      const configId = broadcast.data as string;

      agentConfigStore.update((agents) => {
        return agents.filter((c) => c.id !== configId);
      });
    }
  });
}
