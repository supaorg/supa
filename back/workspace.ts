import { fs } from "./tools/fs.ts";
import { v4 as uuidv4 } from "npm:uuid";

/*
class Workspace {
  readonly path: string;
  readonly db: AppDb;

  constructor(path: string) {
    this.path = path;
    this.db = new AppDb(path);
  }
}
*/

let workspacePath: string | null = null;

export function setWorkspacePath(path: string) {
  workspacePath = path;
}

export async function createWorkspaceInDocuments() {
  const homeDir = Deno.env.get("HOME");
  if (homeDir === undefined) {
    throw new Error("HOME environment variable is not set");
  }

  const iCloudPath = homeDir + "/Library/Mobile Documents/com~apple~CloudDocs";
  const documentsPath = homeDir + "/Documents";

  let dir: string;

  if (await fs.dirExists(iCloudPath)) {
    dir = iCloudPath;
  } else if (await fs.dirExists(documentsPath)) {
    dir = documentsPath;
  } else {
    throw new Error("Neither iCloud nor Documents directory exists");
  }

  return await checkAndCreateWorkspaceDir(dir);
}

async function checkAndCreateWorkspaceDir(rootDir: string): Promise<string> {
  workspacePath = rootDir + "/Supamind/workspace";
  const workspaceExists = await fs.dirExists(workspacePath);
  if (!workspaceExists) {
    await fs.mkdir(workspacePath, { recursive: true });
    const workspaceJsonPath = workspacePath + "/_workspace.json";
    await fs.writeTextFile(workspaceJsonPath, "{}");
  }

  return workspacePath;
}

const SESSIONS_DIR = "/.sessions";

const sessionId = uuidv4();

// start an infinite loop to update session file
// every 5 minutes
setInterval(async () => {
  if (workspacePath === null) {
    return;
  }

  await fs.ensureDir(workspacePath + SESSIONS_DIR);

  const sessionFile = workspacePath + SESSIONS_DIR + "/" + sessionId + ".json";

  await fs.writeTextFile(sessionFile, "{}");
  
}, 10000);
