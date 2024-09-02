import { Thread, AppData } from "@shared/models.ts";
import { DataVersion, CURRENT_DATA_VERSION } from "@shared/versions/dataVersions.ts";
import { WorkspaceDb } from "../db/workspaceDb.ts";

export class ThreadMigration {
  constructor(readonly workspaceDb: WorkspaceDb) {}

  async migrateThreads(threadObjs: object[]) {
    const migratedThreads: Thread[] = [];
  
    for (const thread of threadObjs) {
      const migratedThread = await this.migrateThread(thread);
      migratedThreads.push(migratedThread);
    }
  
    return migratedThreads;
  }

  async migrateThread(threadObj: object) {
    const version = (threadObj as AppData).v || 0;
    const thread = threadObj as Thread;
  
    if (version === CURRENT_DATA_VERSION) {
      return thread;
    }
  
    if (version < DataVersion.USE_APP_CONFIG_ID) {
      // Migrate old threads with 'agentId' OR 'appId' to 'appConfigId'
      const agentId = 'agentId' in threadObj ? threadObj.agentId as string : null;
      const appId = 'appId' in threadObj ? threadObj.appId as string : null;
  
      if (agentId) {
        thread.appConfigId = agentId;
      } else if (appId) {
        thread.appConfigId = appId;
      }
    }
  
    thread.v = CURRENT_DATA_VERSION;

    await this.workspaceDb.updateThread(thread);
  
    return thread;
  }

}