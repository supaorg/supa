import type { SpacePointer } from "./SpacePointer";
import Space from "@shared/spaces/Space";
import { Backend } from "@shared/spaces/Backend";
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
import AppTree from "@shared/spaces/AppTree";

export class LocalSpaceSync {
  private unwatchSpaceFsChanges: UnwatchFn | null = null;
  private connected = false;
  private saveOpsTimer: ReturnType<typeof setInterval> | null = null;
  private savingOpsToFile = false;
  private treeOpsToSave: Map<string, VertexOperation[]> = new Map();
  private saveOpsIntervalMs = 500;
  private backend: Backend;

  constructor(readonly space: Space, private uri: string) {
    space.tree.subscribeToOpApplied(
      (op) => {
        this.handleOpAppliedFromSamePeer(space.tree, op);
      }
    );

    space.observeNewAppTree((appTreeId) => {
      this.handleNewAppTree(appTreeId);
    });

    space.observeTreeLoad((appTreeId) => {
      this.handleLoadAppTree(appTreeId);
    });

    space.registerTreeLoader(async (appTreeId) => {
      try {
        const ops = await loadAllTreeOps(this.uri, appTreeId);

        if (ops.length === 0) {
          throw new Error("No operations found for space");
        }

        const tree = new ReplicatedTree(appTreeId, ops);
        return new AppTree(tree);
      } catch (error) {
        console.error("Error loading app tree", appTreeId, error);
        return undefined;
      }
    });

    this.backend = new Backend(space, true);
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
    if (this.savingOpsToFile) {
      return;
    }

    this.savingOpsToFile = true;

    for (const [treeId, ops] of this.treeOpsToSave.entries()) {
      if (ops.length === 0) {
        continue;
      }

      try {
        const opsJSONLines = turnOpsIntoJSONLines(ops);
        const opsFile = await openFileToCurrentTreeOpsJSONLFile(this.uri, treeId, this.space.tree.peerId);
        await opsFile.write(new TextEncoder().encode(opsJSONLines));
        this.treeOpsToSave.set(treeId, []);
        await opsFile.close();
      } catch (error) {
        console.error("Error saving ops to file", error);
      }
    }

    this.savingOpsToFile = false;
  }

  addOpsToSave(treeId: string, ops: ReadonlyArray<VertexOperation>) {
    let opsToSave = this.treeOpsToSave.get(treeId);
    if (!opsToSave) {
      opsToSave = [];
      this.treeOpsToSave.set(treeId, opsToSave);
    }
    opsToSave.push(...ops);
  }

  private async tryReadOpsFromPeer(path: string) {
    let peerId: string | null = null;
    let treeId: string | null = null;
    try {
      const splitPath = path.split('/');

      peerId = splitPath.pop()!.split('.')[0];

      if (!peerId) {
        throw new Error("Peer ID not found in the path");
      }

      const treeIdEndPart = splitPath.pop();
      if (!treeIdEndPart) {
        throw new Error("Tree ID part 1 not found in the path");
      }

      const treeIdStartPart = splitPath.pop();
      if (!treeIdStartPart) {
        throw new Error("Tree ID part 2 not found in the path");
      }

      treeId = treeIdStartPart + treeIdEndPart;

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

    if (treeId === this.space.tree.rootVertexId) {
      this.space.tree.merge(ops);
    } else {
      const appTree = this.space.getAppTree(treeId);

      if (!appTree) {
        console.log("App tree not found", treeId);
        return;
      }

      appTree.tree.merge(ops);
    }

  }

  private handleWatchEvent(event: WatchEvent) {
    console.log("handleWatchEvent", event);

    if (typeof event.type === 'object' && 'create' in event.type) {
      const createEvent = event.type.create;
      if (createEvent.kind === 'file') {
        const path = event.paths[0];
        this.tryReadOpsFromPeer(path);
      }
    } else if (typeof event.type === 'object' && 'modify' in event.type) {
      const modifyEvent = event.type.modify;
      if (modifyEvent.kind === 'data' && (modifyEvent.mode === 'any' || modifyEvent.mode === 'content')) {
        const path = event.paths[0];
        this.tryReadOpsFromPeer(path);
      }
    }
  }

  private handleOpAppliedFromSamePeer(tree: ReplicatedTree, op: VertexOperation) {
    // Important that we don't save ops from other peers here
    if (op.id.peerId !== tree.peerId) {
      return;
    }

    const treeId = tree.rootVertexId;

    let ops = this.treeOpsToSave.get(treeId);
    if (!ops) {
      ops = [];
      this.treeOpsToSave.set(treeId, ops);
    }
    ops.push(op);

    this.backend.addOp(treeId, op);
  }

  private handleNewAppTree(appTreeId: string) {
    // Add all ops from app tree into the sync
    const appTree = this.space.getAppTree(appTreeId);

    if (!appTree) {
      console.error("App tree not found", appTreeId);
      return;
    }

    const ops = appTree.tree.popLocalOps();
    this.treeOpsToSave.set(appTreeId, ops);
  }

  private handleLoadAppTree(appTreeId: string) {
    const appTree = this.space.getAppTree(appTreeId);

    if (!appTree) {
      throw new Error(`App tree with id ${appTreeId} not found`);
    }

    appTree.tree.subscribeToOpApplied((op) => {
      this.handleOpAppliedFromSamePeer(appTree.tree, op);
    });
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

  const sync = new LocalSpaceSync(space, path);
  const ops = space.tree.getAllOps();
  // Add ops that created the space tree
  sync.addOpsToSave(space.tree.rootVertexId, ops);
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
      str += `["p",${op.id.counter},"${op.targetId}","${op.key}",${JSON.stringify(op.value)}]\n`;
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
