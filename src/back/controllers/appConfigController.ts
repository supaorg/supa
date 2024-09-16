import { AppConfig } from "@shared/models.ts";
import { BackServices } from "./backServices.ts";
import { apiRoutes } from "@shared/apiRoutes.ts";

export function appConfigController(services: BackServices) {
  const router = services.router;

  router
    .onGet(
      apiRoutes.appConfigs(),
      (ctx) =>
        services.workspaceEndpoint(ctx, async (ctx, db) => {
          try {
            const appConfigs = await db.getAppConfigs();
            ctx.response = appConfigs;
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
          const appConfig = await db.getAppConfig(configId);

          if (appConfig === null) {
            ctx.error = "Couldn't get an app config";
            return;
          }

          ctx.response = appConfig;
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
          const oldConfig = await db.getAppConfig(configId);

          if (oldConfig === null) {
            ctx.error = "App config doesn't exist";
            return;
          }

          const config = ctx.data as AppConfig;

          if (config.id !== "default") {
            await db.updateAppConfig(config);
          } else {
            if (oldConfig === null) {
              ctx.error = "Couldn't get the default app config";
              return;
            }

            // For the default - we only allow to update the targetLLM
            const defaultConfigWithUpdTargetLLM = {
              id: config.id,
              targetLLM: config.targetLLM,
              meta: config.meta,
            } as AppConfig;
            await db.updateAppConfig(defaultConfigWithUpdTargetLLM);
          }

          router.broadcastPost(apiRoutes.appConfigs(db.workspace.id), config);
        }),
    )
    .onDelete(
      apiRoutes.appConfig(),
      (ctx) =>
        services.workspaceEndpoint(ctx, async (ctx, db) => {
          const configId = ctx.params.configId;
          await db.deleteAppConfig(configId);
          router.broadcastDeletion(apiRoutes.appConfigs(db.workspace.id), configId);
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
          await db.insertAppConfig(config);
          router.broadcastPost(apiRoutes.appConfigs(db.workspace.id), config);
        }),
    )
    .onValidateBroadcast(apiRoutes.appConfigs(), (conn, params) => {
      return true;
    });
}
