import { AppConfig } from "@shared/models.ts";
import { BackServices } from "./backServices.ts";
import { apiRoutes } from "@shared/apiRoutes.ts";

export function appController(services: BackServices) {
  const router = services.router;

  router
    .onGet(
      apiRoutes.appConfigs(),
      (ctx) =>
        services.workspaceEndpoint(ctx, async (ctx, db) => {
          try {
            const agents = await db.getApps();
            ctx.response = agents;
          } catch (e) {
            ctx.error = e.message;
            return;
          }
        }),
    )
    .onGet(
      apiRoutes.appConfig(),
      (ctx) =>
        services.workspaceEndpoint(ctx, async (ctx, db) => {
          const configId = ctx.params.configId;
          const agent = await db.getAgent(configId);

          if (agent === null) {
            ctx.error = "Couldn't get agent";
            return;
          }

          ctx.response = agent;
        }),
    )
    .onPost(
      apiRoutes.appConfig(),
      (ctx) =>
        services.workspaceEndpoint(ctx, async (ctx, db) => {
          if (ctx.data === null) {
            ctx.error = "Data is required";
            return;
          }

          const configId = ctx.params.configId;
          const oldConfig = await db.getAgent(configId);

          if (oldConfig === null) {
            ctx.error = "Agent doesn't exist";
            return;
          }

          const config = ctx.data as AppConfig;

          if (config.id !== "default") {
            await db.updateAgent(config);
          } else {
            if (oldConfig === null) {
              ctx.error = "Couldn't get the default agent config";
              return;
            }

            // For the default - we only allow to update the targetLLM
            const defaultConfigWithUpdTargetLLM = {
              id: config.id,
              targetLLM: config.targetLLM,
              meta: config.meta,
            } as AppConfig;
            await db.updateAgent(defaultConfigWithUpdTargetLLM);
          }

          router.broadcastPost(apiRoutes.appConfigs(), config);
        }),
    )
    .onDelete(
      apiRoutes.appConfig(),
      (ctx) =>
        services.workspaceEndpoint(ctx, async (ctx, db) => {
          const configId = ctx.params.configId;
          await db.deleteAgent(configId);
          router.broadcastDeletion(apiRoutes.appConfigs(), configId);
        }),
    )
    .onPost(
      apiRoutes.appConfigs(),
      (ctx) =>
        services.workspaceEndpoint(ctx, async (ctx, db) => {
          if (!ctx.data) {
            ctx.error = "Data is required";
            return;
          }

          const config = ctx.data as AppConfig;
          await db.insertAgent(config);
          router.broadcastPost(apiRoutes.appConfigs(), config);
        }),
    )
    .onValidateBroadcast(apiRoutes.appConfigs(), (conn, params) => {
      return true;
    });
}
