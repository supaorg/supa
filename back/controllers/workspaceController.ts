import { BackServices } from "./backServices.ts";
import { Profile } from "@shared/models.ts";
import {
  createWorkspace,
  getWorkspaceFromFiles,
} from "../workspace.ts";
import { fs } from "../tools/fs.ts";
import { apiRoutes } from "@shared/apiRoutes.ts";

export function workspaceController(services: BackServices) {
  const router = services.router;

  router
    .onGet(apiRoutes.workspace(), (ctx) => services.workspaceEndpoint(ctx, async (ctx, db) => {
      ctx.response = db.workspace;
    }))
    .onPost(apiRoutes.workspaces(), async (ctx) => {
      try {
        const { path, create } = ctx.data as { path: string, create: boolean };

        if (!path) {
          ctx.error = "Path to the workspace is required";
          return;
        }

        let workspace = services.getWorkspaceByPath(path);

        if (!workspace) {
          workspace = await getWorkspaceFromFiles(path);

          // TODO: check version here and migrate if needed
        }

        if (!workspace) {
          if (!create) {
            ctx.error = "A workspace doesn't exist in this directory";
            return;
          }

          // Check if the path is empty
          const entries = await fs.readDir(path);
          if (entries.length > 0) {
            ctx.error = "This directory has to be empty to create a workspace";
            return;
          }
          
          workspace = await createWorkspace(path);
        }

        services.setupWorkspace(workspace);

        ctx.response = workspace;
      } catch (e) {
        ctx.error = e.message;
        return;
      }
    })
    .onPost(apiRoutes.setup(), (ctx) => services.workspaceEndpoint(ctx, async (ctx, db) => {
      if (!ctx.data) {
        ctx.error = "Data is required";
        return;
      }

      const data = ctx.data as { name: string };
      if (!data.name) {
        ctx.error = "Name is required";
        return;
      }

      try {
        const profile = await db.insertProfile(
          { name: data.name, setup: true } as Profile,
        );
        router.broadcastPost("profile", profile);
        ctx.response = profile;
      } catch (e) {
        ctx.error = e.message;
        return;
      }
    }))
    .onGet(apiRoutes.profile(), (ctx) => services.workspaceEndpoint(ctx, async (ctx, db) => {
      try {
        const profile = await db.getProfile();
        ctx.response = profile;
      } catch (e) {
        ctx.error = e.message;
        return;
      }
    }))
    .onPost(apiRoutes.profile(), (ctx) => services.workspaceEndpoint(ctx, async (ctx, db) => {
      const profile = ctx.data as Profile;

      try {
        await db.insertProfile(profile);
      } catch (e) {
        ctx.error = e;
        return;
      }

      router.broadcastPost(ctx.route, profile);
    }))
    .onValidateBroadcast(apiRoutes.profile(), (conn, params) => {
      return true;
    })
    .onValidateBroadcast(apiRoutes.session(), (conn, params) => {
      return true;
    });
}
