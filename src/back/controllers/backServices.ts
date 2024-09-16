import { Workspace } from "@shared/models.ts";
import { RequestContext, Router } from "@shared/neorest/Router.ts";
import { WorkspaceDb, loadWorkspace, createWorkspace } from "../db/workspaceDb.ts";

export class BackServices {
  public router: Router;
  public db: Record<string, WorkspaceDb> = {};

  constructor(router: Router) {
    this.router = router;
  }

  async getWorkspaceByPath(path: string): Promise<Workspace | null> {
    for (const workspace of Object.values(this.db)) {
      if (workspace.workspace.path === path) {
        return workspace.workspace;
      }
    }

    const workspace = await loadWorkspace(path);

    if (!workspace) {
      return null;
    }

    this.setupWorkspace(workspace);
    return workspace;
  }

  async createWorkspace(path: string): Promise<Workspace> {
    const workspace = await createWorkspace(path);
    this.setupWorkspace(workspace);
    return workspace;
  }

  setupWorkspace(workspace: Workspace) {
    if (workspace.id in this.db) {
      return;
    }

    // TODO: consider to check version here and throw if it's not compatible

    this.db[workspace.id] = new WorkspaceDb(workspace);
  }
  
  getDbNotSetupError() {
    return "Database is not initialized";
  }

  async workspaceEndpoint(ctx: RequestContext, handler: (ctx: RequestContext, db: WorkspaceDb) => void | Promise<void>) { 
    const workspaceId = ctx.params.workspaceId;

    if (!workspaceId) {
      ctx.error = "workspaceId wasn't provided.";
    }

    if (!(workspaceId in this.db)) {
      ctx.error = `Database for workspace ${workspaceId} doesn't exist`;
      return;
    }

    await handler(ctx, this.db[workspaceId]);
  }

}
