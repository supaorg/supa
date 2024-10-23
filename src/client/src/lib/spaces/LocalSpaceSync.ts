import type { SpacePointer } from "./SpacePointer";
import Space from "@shared/spaces/Space";
import { ReplicatedTree } from "@shared/replicatedTree/ReplicatedTree";
import {
  readDir,
  create,
  open,
  mkdir,
  readTextFile,
  watch,
  type WatchEvent,
  type UnwatchFn,
  exists,
  FileHandle
} from "@tauri-apps/plugin-fs";
import uuid from "@shared/uuid/uuid";
import { isMoveVertexOp, isSetPropertyOp, newMoveVertexOp, newSetVertexPropertyOp, type VertexOperation } from "@shared/replicatedTree/operations";
import { OpId } from "@shared/replicatedTree/OpId";

export class LocalSpaceSync {
  private unwatchSpaceFsChanges: UnwatchFn | null = null;
  private connected = false;
  private saveOpsTimer: NodeJS.Timeout | null = null;
  private savingOpsToFile = false;
  private opsToSave: VertexOperation[] = [];
  private saveOpsIntervalMs = 500;

  constructor(readonly space: Space, private uri: string) {
    space.tree.subscribeToOpApplied(this.handleOpApplied.bind(this));
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    this.unwatchSpaceFsChanges = await watch(this.uri, (event) => {
      this.handleWatchEvent(event);
    }, { recursive: true });

    // Save pending ops every n milliseconds
    this.saveOpsTimer = setInterval(() => {
      this.saveOps();
    }, this.saveOpsIntervalMs);

    this.connected = true;
  }

  disconnect() {
    if (!this.connected) {
      return;
    }

    if (this.unwatchSpaceFsChanges) {
      this.unwatchSpaceFsChanges();
      this.unwatchSpaceFsChanges = null;
    }

    if (this.saveOpsTimer) {
      clearInterval(this.saveOpsTimer);
      this.saveOpsTimer = null;
    }

    this.connected = false;
  }

  private async saveOps() {
    if (this.opsToSave.length === 0 || this.savingOpsToFile) {
      return;
    }

    console.log("Saving ops to file", this.opsToSave.length);

    this.savingOpsToFile = true;

    try {
      const opsJSONLines = turnOpsIntoJSONLines(this.opsToSave);
      const opsFile = await openFileToCurrentTreeOpsJSONLFile(this.uri, this.space.tree.rootVertexId, this.space.tree.peerId);
      await opsFile.write(new TextEncoder().encode(opsJSONLines));
      await opsFile.close();
      this.opsToSave = [];
      this.savingOpsToFile = false;
      console.log("Saved ops to file", this.opsToSave.length);
    } catch (error) {
      this.savingOpsToFile = false;
      console.error("Error saving ops to file", error);
    }
  }

  private async readOps(path: string) {
    let peerId: string | null = null;
    try {
      peerId = path.split('/').pop()!.split('.')[0];

      if (!peerId) {
        throw new Error("Peer ID not found in the path");
      }
    } catch (e) {
      console.error("Error getting peerId from", path);
      return;
    }

    if (peerId === this.space.tree.peerId) {
      return;
    }

    const ops = turnJSONLinesIntoOps(await readTextFile(path), peerId);

    if (ops.length === 0) {
      return;
    }

    this.space.tree.merge(ops);
  }

  private handleWatchEvent(event: WatchEvent) {
    console.log("handleWatchEvent", event);

    if (typeof event.type === 'object' && 'create' in event.type) {
      const createEvent = event.type.create;
      if (createEvent.kind === 'file') {
        const path = event.paths[0];
        this.readOps(path);
      }
    } else if (typeof event.type === 'object' && 'modify' in event.type) {
      const modifyEvent = event.type.modify;
      if (modifyEvent.kind === 'data' && (modifyEvent.mode === 'any' || modifyEvent.mode === 'content')) {
        const path = event.paths[0];
        this.readOps(path);
      }
    }
  }

  private handleOpApplied(op: VertexOperation) {
    if (op.id.peerId === this.space.tree.peerId) {
      this.opsToSave.push(op);
    }
  }

  private async loadSpaceTreeFromPath(path: string): Promise<ReplicatedTree> {
    // check if space.json at path + /v1/space.json exists
    // then go to /v1/ops/ and load all op files
    // subscribe to changes in that folder and load new ops
    // subscribe to changes in space tree and save ops in the folder    

    //const path = uri.replace("file://", "");

    return new ReplicatedTree(this.space.getId());
  }
}

export async function createNewLocalSpaceAndConnect(path: string): Promise<LocalSpaceSync> {
  const dirEntries = await readDir(path);
  // Exclude all dot directories (e.g .DS_Store, .git)
  const filteredDirEntries = dirEntries.filter(entry => entry.isDirectory && !entry.name.startsWith('.'));
  // Make sure the directory is empty (except for dot directories)
  if (filteredDirEntries.length > 0) {
    throw new Error("Directory is not empty");
  }

  const space = Space.newSpace(uuid());

  // Create space.json
  const pathToSpaceJson = path + '/space.json';
  const file = await create(pathToSpaceJson);
  await file.write(new TextEncoder().encode(JSON.stringify({
    id: space.getId(),
  })));

  // Create ops that created the space
  await saveTreeOpsFromScratch(space.tree, path);

  const sync = new LocalSpaceSync(space, path);
  await sync.connect();
  return sync;
}

export async function loadLocalSpaceAndConnect(path: string): Promise<LocalSpaceSync> {
  const space = await loadLocalSpace(path);
  const sync = new LocalSpaceSync(space, path);
  await sync.connect();
  return sync;
}

export async function loadSpaceFromPointer(pointer: SpacePointer): Promise<LocalSpaceSync> {
  if (pointer.uri.startsWith("http")) {
    throw new Error("Remote spaces are not implemented yet");
  }

  const space = await loadLocalSpace(pointer.uri);
  if (space.getId() !== pointer.id) {
    throw new Error("Space ID mismatch. Expected " + pointer.id + " but got " + space.getId());
  }

  const sync = new LocalSpaceSync(space, pointer.uri);
  await sync.connect();
  return sync;
}

async function saveTreeOpsFromScratch(tree: ReplicatedTree, spacePath: string) {
  const opsPath = makePathForOpsBasedOnDate(spacePath, tree.rootVertexId, new Date());
  await mkdir(opsPath, { recursive: true });

  const opsJSONLines = turnOpsIntoJSONLines(tree.popLocalOps());

  // Save ops with a file name corresponding to peerId
  const opsFile = await create(opsPath + '/' + tree.peerId + '.jsonl');
  await opsFile.write(new TextEncoder().encode(opsJSONLines));
  await opsFile.close();
}

function makePathForTree(spacePath: string, treeId: string): string {
  // Path to a tree is a guid split in 2 parts to make a path with 2 levels, 
  // with the first 2 characters of the guid as the first directory name.
  // and the rest of the guid as the second directory name.
  // E.g. f7/8f29f578fd42c9b31766f269998263
  const treePath = treeId.substring(0, 2) + '/' + treeId.substring(2);
  return spacePath + '/ops/' + treePath;
}

function makePathForOpsBasedOnDate(spacePath: string, treeId: string, date: Date): string {
  const treePath = makePathForTree(spacePath, treeId);
  return treePath + '/' + date.toISOString().split('T')[0];
}

async function openFileToCurrentTreeOpsJSONLFile(spacePath: string, treeId: string, peerId: string): Promise<FileHandle> {
  const opsPath = makePathForOpsBasedOnDate(spacePath, treeId, new Date());
  await mkdir(opsPath, { recursive: true });
  const filePath = opsPath + '/' + peerId + '.jsonl';

  if (await exists(filePath)) {
    return await open(filePath, { append: true });
  }

  return await create(filePath);
}

async function loadLocalSpace(path: string): Promise<Space> {
  // Check if the path exists
  // Check if the path is a directory and it has space.json file

  const spacePath = path + '/space.json';
  const spaceJson = await readTextFile(spacePath);

  if (!spaceJson) {
    throw new Error("space.json not found");
  }

  // Get id from spaceJson
  const spaceData = JSON.parse(spaceJson);
  const spaceId = spaceData.id;

  if (!spaceId) {
    throw new Error("Space ID not found in space.json");
  }

  // Load space tree 
  const ops = await loadAllTreeOps(path, spaceId);

  if (ops.length === 0) {
    throw new Error("No operations found for space");
  }

  console.log("Loaded ops", ops.length);

  return new Space(new ReplicatedTree(uuid(), ops));
}

async function loadAllTreeOps(spacePath: string, treeId: string): Promise<VertexOperation[]> {
  const treeOpsPath = makePathForTree(spacePath, treeId);

  // Read all directories and get .jsonl files
  const dirEntries = await readDir(treeOpsPath);
  const datePaths: string[] = [];
  const jsonlFiles: string[] = [];
  for (const entry of dirEntries) {
    // Read all dirs that match YYYY-MM-DD
    if (entry.isDirectory && entry.name.match(/^\d{4}-\d{2}-\d{2}$/)) {
      datePaths.push(treeOpsPath + '/' + entry.name);
    }
  }

  // Sort datePaths so we will read the files from older to newer
  datePaths.sort();

  for (const datePath of datePaths) {
    const jsonlFilesInDir = await readDir(datePath);
    for (const file of jsonlFilesInDir) {
      if (file.isFile && file.name.endsWith('.jsonl')) {
        jsonlFiles.push(datePath + '/' + file.name);
      }
    }
  }

  const allOps: VertexOperation[] = [];
  for (const file of jsonlFiles) {
    const fileContent = await readTextFile(file);
    // Peer ID is the file name without the .jsonl extension and path
    const peerId = file.split('/').pop()!.split('.')[0];
    const ops = turnJSONLinesIntoOps(fileContent, peerId);
    allOps.push(...ops);
  }

  return allOps;
}

function turnOpsIntoJSONLines(ops: VertexOperation[]): string {
  let str = '';

  /*
  ["m",1,"node1","node2"]\n
  ["p",2,"node1","name","hello world"]\n
  */
  for (const op of ops) {
    if (isMoveVertexOp(op)) {
      // We save parentId like that because it might be null and we want to save null with quotes
      str += `["m",${op.id.counter},"${op.targetId}",${JSON.stringify(op.parentId)}]\n`;
    } else if (isSetPropertyOp(op)) {
      str += `["p",${op.id.counter},"${op.targetId}","${op.key}","${op.value}"]\n`;
    }
  }

  return str;
}

function turnJSONLinesIntoOps(jsonLines: string, peerId: string): VertexOperation[] {
  const ops: VertexOperation[] = [];

  // Split JSON lines using a regex that respects quotes and escaped characters
  const lineRegex = /\r?\n(?=(?:(?:[^"\\]|\\[^"]|\\")*"(?:[^"\\]|\\[^"]|\\")*")*(?:[^"\\]|\\[^"]|\\")*$)/;
  const lines = jsonLines.split(lineRegex);

  for (const line of lines) {
    if (line.trim()) {
      try {
        const [opType, counter, targetId, ...rest] = JSON.parse(line);
        if (opType === "m" && rest.length === 1) {
          ops.push(newMoveVertexOp(counter, peerId, targetId, rest[0]));
        } else if (opType === "p" && rest.length === 2) {
          ops.push(newSetVertexPropertyOp(counter, peerId, targetId, rest[0], rest[1]));
        } else {
          console.warn("Unknown operation type or invalid format:", line);
        }
      } catch (error) {
        console.error("Error parsing JSON line:", line, error);
      }
    }
  }

  return ops;
}
