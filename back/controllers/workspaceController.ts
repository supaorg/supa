import { BackServices } from "./backServices.ts";
import { Profile } from "@shared/models.ts";
import { createWorkspaceInDocuments, setWorkspacePath } from "../workspace.ts";
import { fs } from "../tools/fs.ts";
import { routes } from "../../shared/routes/routes.ts";

async function checkWorkspaceDir(path: string): Promise<boolean> {
  const pathToWorkspace = path + "/_workspace.json";

  return await fs.fileExists(pathToWorkspace);
}

export function workspaceController(services: BackServices) {
  const router = services.router;

  router
    .onPost(routes.newWorkspace, async (ctx) => {
      try {
        const path = await createWorkspaceInDocuments();
        services.setupDatabase(path);
        ctx.response = path;
      } catch (e) {
        ctx.error = e.message;
      }
    })
    .onPost(routes.workspace, async (ctx) => {
      try {
        const path = ctx.data as string;
        const exists = await checkWorkspaceDir(path);
        ctx.response = exists;

        if (exists) {
          if (services.db === null) {
            services.setupDatabase(path);
          }

          await setWorkspacePath(path);
        }
      } catch (e) {
        ctx.error = e.message;
        return;
      }
    })
    .onPost(routes.workspaceExists, async (ctx) => {
      try {
        const path = ctx.data as string;
        ctx.response = await checkWorkspaceDir(path);
      } catch (e) {
        ctx.error = e.message;
        return;
      }
    })
    .onPost(routes.setup, async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      if (!ctx.data) {
        ctx.error = "Data is required";
        return;
      }

      const data = ctx.data as { name: string; };
      if (!data.name) {
        ctx.error = "Name is required";
        return;
      }

      try {
        const profile = await services.db.insertProfile({ name: data.name, setup: true } as Profile);
        router.broadcast("profile", profile);
        ctx.response = profile;
      } catch (e) {
        ctx.error = e.message;
        return;
      }
    })
    .onGet(routes.profile, async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      try {
        const profile = await services.db.getProfile();
        ctx.response = profile;
      } catch (e) {
        ctx.error = e.message;
        return;
      }
    })
    .onPost(routes.profile, async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      const profile = ctx.data as Profile;
      await services.db.insertProfile(profile);
      router.broadcast(ctx.route, profile);
    })
    .onValidateBroadcast(routes.profile, (conn, params) => {
      return true;
    })
    .onValidateBroadcast(routes.session, (conn, params) => {
      return true;
    });
}
