import { BackServices } from "./backServices.ts";
import { Profile } from "@shared/models.ts";
import { createWorkspaceInDocuments, setWorkspacePath } from "../workspace.ts";
import { fs } from "../tools/fs.ts";
import { routes } from "../../shared/routes/routes.ts";
import { Workspace } from "../../shared/models.ts";

async function checkWorkspaceDir(path: string): Promise<Workspace | null> {
  const pathToWorkspace = path + "/_workspace.json";

  if (!await fs.fileExists(pathToWorkspace)) {
    return null;
  }

  const file = await fs.readTextFile(path);
  const workspace = JSON.parse(file) as Workspace;

  if (!workspace.id) {
    return null;
  }

  return workspace;
}

export function workspaceController(services: BackServices) {
  const router = services.router;

  router
    .onGet(routes.workspace, (ctx) => {
      ctx.response = services.db !== null ? services.db.workspaceDir : "";
    })
    .onPost(routes.workspace, async (ctx) => {
      try {
        const path = ctx.data as string;
        const exists = await checkWorkspaceDir(path);

        if (!exists) {
          const path = await createWorkspaceInDocuments();
          services.setupDatabase(path);
        }

        services.setupDatabase(path);
        ctx.response = path;
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
