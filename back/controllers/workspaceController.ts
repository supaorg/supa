import { BackServices } from "./backServices.ts";
import { Profile } from "@shared/models.ts";
import {
  createWorkspaceInDocuments,
  getWorkspace,
  setWorkspacePath,
} from "../workspace.ts";
import { fs } from "../tools/fs.ts";
import { apiRoutes } from "@shared/apiRoutes.ts";
import { Workspace } from "../../shared/models.ts";

export function workspaceController(services: BackServices) {
  const router = services.router;

  router
    .onGet(apiRoutes.workspace(), (ctx) => {
      ctx.response = services.db && services.db.workspace
        ? services.db.workspace
        : null;
    })
    .onPost(apiRoutes.workspace(), async (ctx) => {
      try {
        if (services.db) {
          ctx.error = "Database is already initialized";
          return;
        }

        const path = ctx.data as string;

        if (!path) {
          ctx.error = "Path to the workspace is required";
          return;
        }

        let workspace = await getWorkspace(path);
        if (!workspace) {
          //workspace = await createWorkspaceInDocuments();
          ctx.error = "Couldn't find a workspace";
          return;
        }

        services.setupDatabase(workspace);
        ctx.response = workspace;
      } catch (e) {
        ctx.error = e.message;
        return;
      }
    })
    .onPost(apiRoutes.setup(), async (ctx) => {
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
        router.broadcastPost("profile", profile);
        ctx.response = profile;
      } catch (e) {
        ctx.error = e.message;
        return;
      }
    })
    .onGet(apiRoutes.profile(), async (ctx) => {
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
    .onPost(apiRoutes.profile(), async (ctx) => {
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

      router.broadcastPost(ctx.route, profile);
    })
    .onValidateBroadcast(apiRoutes.profile(), (conn, params) => {
      return true;
    })
    .onValidateBroadcast(apiRoutes.session(), (conn, params) => {
      return true;
    });
}
