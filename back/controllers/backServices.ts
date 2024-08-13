import { Workspace } from "../../shared/models.ts";
import { RequestContext, Router } from "../../shared/neorest/Router.ts";
import { WorkspaceDb } from "../db/workspaceDb.ts";

export class BackServices {
  public router: Router;
  public db: WorkspaceDb | null; // @TODO: have a list of 'workspaces', rename AppDb to WorkspaceDb

  constructor(router: Router) {
    this.router = router;
    this.db = null;
  }

  setupDatabase(workspace: Workspace) {
    if (this.db !== null) {
      throw new Error("Database is already initialized");
    }

    this.db = new WorkspaceDb(workspace);
  }
  
  getDbNotSetupError() {
    return "Database is not initialized";
  }

  workspaceEndpoint(ctx: RequestContext, handler: (ctx: RequestContext) => void | Promise<void>) { 
    const workspaceId = ctx.params.workspaceId;

    if (!workspaceId) {
      ctx.error = "workspaceId wasn't provided.";
    }

    // TODO: find workspace from dbs
  }

}
