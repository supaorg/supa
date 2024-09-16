import { Workspace } from "@shared/models.ts";
import { CURRENT_DATA_VERSION } from "@shared/versions/dataVersions.ts";
import { WorkspaceDb } from "../db/workspaceDb.ts";

export async function migrateWorkspace(workspace: Workspace): Promise<Workspace> {
  const version = workspace.v || 0;

  if (version === CURRENT_DATA_VERSION) {
    return workspace;
  }

  // No specific migration logic needed, just update the version
  workspace.v = CURRENT_DATA_VERSION;

  const workspaceDb = new WorkspaceDb(workspace);
  await workspaceDb.updateWorkspace(workspace);

  return workspace;
}