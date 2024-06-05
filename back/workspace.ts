import { Workspace } from "../shared/models.ts";
import { neoRouter } from "./main.ts";
import { fs } from "./tools/fs.ts";
import { v4 as uuidv4 } from "npm:uuid";

let workspacePath: string | null = null;

export async function setWorkspacePath(path: string) {
  workspacePath = path;

  await writeSessionFile();
}

export async function getWorkspace(path: string): Promise<Workspace | null> {
  const pathToWorkspace = path + "/_workspace.json";

  if (!await fs.fileExists(pathToWorkspace)) {
    return null;
  }

  const file = await fs.readTextFile(pathToWorkspace);
  const workspace = JSON.parse(file) as Workspace;

  if (!workspace.id || !workspace.createdAt) {
    return null;
  }

  // The file doesn't suppose to have the path, so we're adding it here after loading the file
  workspace.path = path;

  return workspace;
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

async function checkAndCreateWorkspaceDir(rootDir: string): Promise<Workspace> {
  workspacePath = rootDir + "/Supamind/workspace";
  const workspaceExists = await fs.dirExists(workspacePath);
  let workspace: Workspace;
  if (!workspaceExists) {
    await fs.mkdir(workspacePath, { recursive: true });
    const workspaceJsonPath = workspacePath + "/_workspace.json";

    workspace = { 
      id: uuidv4(),
      name: null,
      createdAt: new Date().getTime(),
    } as Workspace;

    await fs.writeTextFile(workspaceJsonPath, JSON.stringify(workspace));

    // We're not adding path to the file because it's not needed
    workspace.path = workspacePath;

  } else {
    const workspaceJsonPath = workspacePath + "/_workspace.json";
    const workspaceJson = await fs.readTextFile(workspaceJsonPath);
    workspace = JSON.parse(workspaceJson) as Workspace;

    if (!workspace.id || !workspace.createdAt) {
      throw new Error("Workspace is not valid");
    }

    // The file doesn't suppose to have path, so we're adding it here after loading the file
    workspace.path = workspacePath;
  }

  return workspace;
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
    neoRouter.broadcastPost("session", {
      error: "fs-permission",
    });
  }
}

setInterval(async () => {
  await writeSessionFile();
}, 3000);
