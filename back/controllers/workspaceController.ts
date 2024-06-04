import { BackServices } from "./backServices.ts";
import { Profile } from "@shared/models.ts";
import { createWorkspaceInDocuments, setWorkspacePath, getWorkspace } from "../workspace.ts";
import { fs } from "../tools/fs.ts";
import { routes } from "../../shared/routes/routes.ts";
import { Workspace } from "../../shared/models.ts";

export function workspaceController(services: BackServices) {
  const router = services.router;

  router
    .onGet(routes.workspace, (ctx) => {
      ctx.response = services.db && services.db.workspace ? services.db.workspace : null;
    })
    .onPost(routes.workspace, async (ctx) => {
      try {
        if (services.db) {
          ctx.error = "Database is already initialized";
          return;
        }

        const path = ctx.data as string;
        let workspace = await getWorkspace(path);

        if (!workspace) {
          workspace = await createWorkspaceInDocuments();
        }

        services.setupDatabase(workspace);
        ctx.response = workspace;
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

      const data = ctx.data as { name: string };
      if (!data.name) {
        ctx.error = "Name is required";
        return;
      }

      try {
        const profile = await services.db.insertProfile(
          { name: data.name, setup: true } as Profile,
        );
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

      try {
        await services.db.insertProfile(profile);
      } catch (e) {
        ctx.error = e;
        return;
      }

      router.broadcast(ctx.route, profile);
    })
    .onValidateBroadcast(routes.profile, (conn, params) => {
      return true;
    })
    .onValidateBroadcast(routes.session, (conn, params) => {
      return true;
    });
}
