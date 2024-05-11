import { AgentConfig } from "@shared/models.ts";
import { BackServices } from "./backServices.ts";

export function agentController(services: BackServices) {
  const router = services.router;

  router
    .onGet("agent-configs", async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      try {
        const agents = await services.db.getAgents();
        ctx.response = agents;
      } catch (e) {
        ctx.error = e.message;
        return;
      }
    })
    .onGet("agent-configs/:configId", async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      const configId = ctx.params.configId;
      const agent = await services.db.getAgent(configId);

      if (agent === null) {
        ctx.error = "Couldn't get agent";
        return;
      }

      ctx.response = agent;
    })
    .onPost("agent-configs/:configId", async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      if (ctx.data === null) {
        ctx.error = "Data is required";
        return;
      }

      const configId = ctx.params.configId;
      const oldConfig = await services.db.getAgent(configId);

      if (oldConfig === null) {
        ctx.error = "Agent doesn't exist";
        return;
      }

      const config = ctx.data as AgentConfig;

      if (config.id !== "default") {
        await services.db.updateAgent(config);
      } else {
        if (oldConfig === null) {
          ctx.error = "Couldn't get the default agent config";
          return;
        }

        // For the default - we only allow to update the targetLLM
        const defaultConfigWithUpdTargetLLM = { id: config.id, targetLLM: config.targetLLM, meta: config.meta };
        await services.db.updateAgent(defaultConfigWithUpdTargetLLM);
      }

      
      router.broadcast("agent-configs", config);
    })
    .onDelete("agent-configs/:configId", async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      const configId = ctx.params.configId;
      await services.db.deleteAgent(configId);
      router.broadcastDeletion("agent-configs", configId);
    })
    .onPost("agent-configs", async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      if (!ctx.data) {
        ctx.error = "Data is required";
        return;
      }

      const config = ctx.data as string as AgentConfig;
      await services.db.insertAgent(config);
      router.broadcast("agent-configs", config);
    })
    .onValidateBroadcast("agent-configs", (conn, params) => {
      return true;
    });
}
