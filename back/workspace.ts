import { Workspace } from "../shared/models.ts";
import { neoRouter } from "./main.ts";
import { fs } from "./tools/fs.ts";
import { v4 as uuidv4 } from "npm:uuid";

let workspacePath: string | null = null;

export async function setWorkspacePath(path: string) {
  workspacePath = path;

  await writeSessionFile();
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
    await fs.writeTextFile(workspaceJsonPath, JSON.stringify({ 
      id: uuidv4(),
      name: null,
      createdAt: new Date().getTime(),
    } as Workspace));
  }

  return workspacePath;
}

const SESSIONS_DIR = "/sessions";

const sessionId = uuidv4();

type Session = {
  id: string;
  startedAt: Date;
  updatedAt: Date;
};

async function writeSessionFile() {
  if (workspacePath === null) {
    return;
  }

  try {
    await fs.ensureDir(workspacePath + SESSIONS_DIR);

    const sessionFile = workspacePath + SESSIONS_DIR + "/" + sessionId +
      ".json";

    await fs.writeTextFile(
      sessionFile,
      JSON.stringify({
        id: sessionId,
        startedAt: new Date(),
        updatedAt: new Date(),
      } as Session),
    );
  } catch (e) {
    console.error(e);
    // @TODO: refactor, use one from backServices
    neoRouter.broadcast("session", {
      error: "fs-permission",
    });
  }
}

setInterval(async () => {
  await writeSessionFile();
}, 3000);
