import type { SpacePointer } from "./SpacePointer";
import Space from "@core/spaces/Space";
import { Backend } from "@core/spaces/Backend";
import {
  RepTree,
  isMoveVertexOp,
  isAnyPropertyOp,
  newMoveVertexOp,
  newSetVertexPropertyOp,
  type VertexOperation
} from "reptree";

import {
  readDir,
  create,
  open,
  mkdir,
  readTextFile,
  readTextFileLines,
  writeTextFile,
  watch,
  type WatchEvent,
  type UnwatchFn,
  exists,
  FileHandle
} from "@tauri-apps/plugin-fs";
import uuid from "@core/uuid/uuid";
import AppTree from "@core/spaces/AppTree";
import perf from "@core/tools/perf";
import { interval } from "@core/tools/interval";
import { migrateSpaceIfNeeded } from "./migrations/SpaceMigrations";
import { loadV1TreeOps } from "./migrations/versions/migrateSpace_V0";

const opsParserWorker = new Worker(new URL('./opsParser.worker.ts', import.meta.url));

type ParsedOp = {
  type: 'm' | 'p';
  counter: number;
  peerId: string;
  targetId: string;
  parentId?: string;
  key?: string;
  value?: any;
};

async function encryptSecrets(secretsObj: Record<string, string>, key: string): Promise<string> {
  // Convert the key string to a crypto key
  const encoder = new TextEncoder();
  const keyBuffer = encoder.encode(key);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  // Convert secrets to string and encrypt
  const secretsString = JSON.stringify(secretsObj);
  const secretsBuffer = encoder.encode(secretsString);

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    secretsBuffer
  );

  // Combine IV and encrypted data and convert to base64
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  return btoa(String.fromCharCode(...combined));
}

async function decryptSecrets(encryptedData: string, key: string): Promise<Record<string, string>> {
  // Convert the key string to a crypto key
  const encoder = new TextEncoder();
  const keyBuffer = encoder.encode(key);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  // Convert base64 back to array buffer
  const combined = new Uint8Array(
    atob(encryptedData).split('').map(c => c.charCodeAt(0))
  );

  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encryptedBuffer = combined.slice(12);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    encryptedBuffer
  );

  const decryptedString = new TextDecoder().decode(decryptedBuffer);
  try {
    return JSON.parse(decryptedString);
  } catch (error) {
    return {};
  }
}

export interface SpaceConnection {
  get space(): Space;
  get connected(): boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export const LOCAL_SPACE_MD_FILE = 'supa.md';
export const TEXT_INSIDE_LOCAL_SPACE_MD_FILE = `# Supa Space

This directory contains a Supa space. Please do not rename or modify the 'space-v1' folder as you won't be able to open the space from Supa. Supa needs it as is.`;

async function containsSpaceVersionDir(dir: string): Promise<boolean> {
  try {
    const entries = await readDir(dir);
    return entries.some(entry => entry.isDirectory && entry.name.startsWith('space-v'));
  } catch (error) {
    return false;
  }
}

/**
 * Checks if the provided path is a valid space directory or contains one
 * @param path The path to check
 * @returns The root path of the space
 * @throws If no valid space directory is found
 */
export async function checkIfPathHasValidStructureAndReturnActualRootPath(path: string): Promise<string> {
  // Check if current directory contains a space-v* directory
  if (await containsSpaceVersionDir(path)) {
    return path;
  }
  
  // Check if we're inside a space-v* directory (one level deep)
  const pathParts = path.split('/');
  const lastPart = pathParts[pathParts.length - 1];
  if (lastPart.startsWith('space-v')) {
    const parentPath = pathParts.slice(0, -1).join('/');
    if (await exists(`${parentPath}/${lastPart}`)) {
      return parentPath;
    }
  }
  
  // Check one level up for a space-v* directory
  const parentPath = path + '/..';
  if (await containsSpaceVersionDir(parentPath)) {
    return parentPath;
  }
  
  throw new Error('Not a valid Supa space directory. Expected to find a space-v* directory.');
}

export class LocalSpaceSync implements SpaceConnection {
  private unwatchSpaceFsChanges: UnwatchFn | null = null;
  private _connected = false;
  private saveOpsTimer: (() => void) | null = null;
  private savingOpsToFile = false;
  private treeOpsToSave: Map<string, VertexOperation[]> = new Map();
  private saveOpsIntervalMs = 500;
  private saveSecretsTimer: (() => void) | null = null;
  private saveSecretsIntervalMs = 1000;
  private backend: Backend;
  private readonly spaceVersion = 1; // Current space version

  constructor(readonly space: Space, private uri: string) {
    space.tree.observeOpApplied(
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
        let p = perf("1. loadAllTreeOps");
        const ops = await loadAllTreeOps(this.uri, appTreeId);
        p.stop();
        if (ops.length === 0) {
          throw new Error("No operations found for space");
        }

        p = perf("2. RepTree");
        const tree = new RepTree(uuid(), ops);
        p.stop();
        return new AppTree(tree);
      } catch (error) {
        console.error("Error loading app tree", appTreeId, error);
        return undefined;
      }
    });

    this.backend = new Backend(space, true);
  }

  get connected(): boolean {
    return this._connected;
  }

  async connect(): Promise<void> {
    if (this._connected) {
      return;
    }

    await this.loadSecretsFromFile();

    try {
      this.unwatchSpaceFsChanges = await watch(
        this.uri,
        this.handleWatchEvent.bind(this),
        { recursive: true }
      );
    } catch (error) {
      console.error("Error setting up watch:", error);
      // Continue without watching - this will make sync one-way only
      // but won't break the app completely
    }

    // Save pending ops every n milliseconds
    this.saveOpsTimer = interval(() => this.saveOps(), this.saveOpsIntervalMs);

    // Save secrets every n milliseconds
    this.saveSecretsTimer = interval(() => this.checkIfSecretsNeedToBeSaved(), this.saveSecretsIntervalMs);

    this._connected = true;
  }

  async disconnect(): Promise<void> {
    if (!this._connected) {
      return;
    }

    if (this.unwatchSpaceFsChanges) {
      this.unwatchSpaceFsChanges();
      this.unwatchSpaceFsChanges = null;
    }

    if (this.saveOpsTimer) {
      this.saveOpsTimer();
      this.saveOpsTimer = null;
    }

    if (this.saveSecretsTimer) {
      this.saveSecretsTimer();
      this.saveSecretsTimer = null;
    }

    this._connected = false;
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

      // Extract peer ID from the filename (remove .jsonl extension)
      peerId = splitPath.pop()!.split('.')[0];

      if (!peerId) {
        throw new Error("Peer ID not found in the path");
      }

      // New format with YYYY/MM/DD structure
      // Pop day directory
      const dayDir = splitPath.pop();
      if (!dayDir || !dayDir.match(/^\d{2}$/)) {
        throw new Error("Day directory not found in the path");
      }

      // Pop month directory
      const monthDir = splitPath.pop();
      if (!monthDir || !monthDir.match(/^\d{2}$/)) {
        throw new Error("Month directory not found in the path");
      }

      // Pop year directory
      const yearDir = splitPath.pop();
      if (!yearDir || !yearDir.match(/^\d{4}$/)) {
        throw new Error("Year directory not found in the path");
      }

      // Extract the second part of the tree ID
      const treeIdEndPart = splitPath.pop();
      if (!treeIdEndPart) {
        throw new Error("Tree ID part 2 not found in the path");
      }

      // Extract the first part of the tree ID (2 characters)
      const treeIdStartPart = splitPath.pop();
      if (!treeIdStartPart) {
        throw new Error("Tree ID part 1 not found in the path");
      }

      // Combine to get the full tree ID
      treeId = treeIdStartPart + treeIdEndPart;

    } catch (e) {
      console.error("Error getting peerId from", path);
      return;
    }

    if (peerId === this.space.tree.peerId) {
      return;
    }

    const linesIterator = await readTextFileLines(path);
    const lines: string[] = [];
    for await (const line of linesIterator) {
      lines.push(line);
    }
    const ops = await turnJSONLinesIntoOps(lines, peerId);

    if (ops.length === 0) {
      return;
    }

    if (treeId === this.space.tree.root!.id) {
      this.space.tree.merge(ops);
    } else {
      const appTree = this.space.getAppTree(treeId);

      if (!appTree) {
        console.error("App tree not found", treeId);
        return;
      }

      appTree.tree.merge(ops);
    }
  }

  private async tryReadSecretsFromPeer(path: string) {
    const secrets = await readTextFile(path);
    this.space.saveAllSecrets(JSON.parse(secrets));
  }

  private async loadSecretsFromFile() {
    try {
      const secrets = await this.readSecretsFromFile();
      if (secrets) {
        this.space.saveAllSecrets(secrets);
      }
    } catch (e) {
      console.error("Error loading secrets", e);
    }
  }

  private async checkIfSecretsNeedToBeSaved() {
    const secrets = this.space.getAllSecrets();
    if (!secrets) {
      return;
    }

    const secretsFromFile = await this.readSecretsFromFile();
    if (!secretsFromFile) {
      // If no secrets in file yet, we should save
      await this.writeSecretsToFile(secrets);
      return;
    }

    // Compare the stringified versions of both objects
    const currentSecretsStr = JSON.stringify(secrets, Object.keys(secrets).sort());
    const fileSecretsStr = JSON.stringify(secretsFromFile, Object.keys(secretsFromFile).sort());

    if (currentSecretsStr === fileSecretsStr) {
      return;
    }

    await this.writeSecretsToFile(secrets);
  }

  private async readSecretsFromFile(): Promise<Record<string, string> | undefined> {
    const secretsPath = this.uri + '/space-v1/secrets';

    if (!await exists(secretsPath)) {
      return undefined;
    }

    const encryptedData = await readTextFile(secretsPath);
    if (!encryptedData) {
      return undefined;
    }

    return await decryptSecrets(encryptedData, this.space.getId());
  }

  private async writeSecretsToFile(secrets: Record<string, string>) {
    const encryptedData = await encryptSecrets(secrets, this.space.getId());
    // Always write to the versioned path
    const secretsPath = this.uri + '/space-v1/secrets';
    await writeTextFile(secretsPath, encryptedData);
  }

  private handleWatchEvent(event: WatchEvent) {
    if (typeof event.type === 'object' && 'create' in event.type) {
      const createEvent = event.type.create;
      if (createEvent.kind === 'file') {
        const path = event.paths[0];

        if (path.endsWith('.jsonl')) {
          this.tryReadOpsFromPeer(path);
        } else if (path.endsWith('secrets')) {
          this.tryReadSecretsFromPeer(path);
        }
      }
    } else if (typeof event.type === 'object' && 'modify' in event.type) {
      const modifyEvent = event.type.modify;
      if (modifyEvent.kind === 'data' && (modifyEvent.mode === 'any' || modifyEvent.mode === 'content')) {
        const path = event.paths[0];

        if (path.endsWith('.jsonl')) {
          this.tryReadOpsFromPeer(path);
        } else if (path.endsWith('secrets')) {
          this.tryReadSecretsFromPeer(path);
        }
      }
    }
  }

  private handleOpAppliedFromSamePeer(tree: RepTree, op: VertexOperation) {
    // Important that we don't save ops from other peers here
    if (op.id.peerId !== tree.peerId) {
      return;
    }

    const treeId = tree.root!.id;

    let ops = this.treeOpsToSave.get(treeId);
    if (!ops) {
      ops = [];
      this.treeOpsToSave.set(treeId, ops);
    }

    // Only save move ops or non-transient property ops (so, no transient properties)
    if (!isAnyPropertyOp(op) || !op.transient) {
      ops.push(op);
    }
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

    appTree.tree.observeOpApplied((op) => {
      this.handleOpAppliedFromSamePeer(appTree.tree, op);
    });
  }

  private handleLoadAppTree(appTreeId: string) {
    const appTree = this.space.getAppTree(appTreeId);

    if (!appTree) {
      throw new Error(`App tree with id ${appTreeId} not found`);
    }

    appTree.tree.observeOpApplied((op) => {
      this.handleOpAppliedFromSamePeer(appTree.tree, op);
    });
  }
}

export async function createNewLocalSpaceAndConnect(path: string): Promise<SpaceConnection> {
  let parentDirIsSpaceDir = false;
  // First check if parent directory contains a space version directory
  try {
    const parentDir = path.split('/').slice(0, -1).join('/');
    if (parentDir && await containsSpaceVersionDir(parentDir)) {
      parentDirIsSpaceDir = true;
    }
  } catch (error) {
    // We do try/catch just in case if we don't have permissions to read the parent directory
    parentDirIsSpaceDir = false;
  }

  if (parentDirIsSpaceDir) {
    throw new Error("Cannot create a space inside another space directory");
  }

  const dirEntries = await readDir(path);
  // Exclude all dot directories (e.g .DS_Store, .git)
  const filteredDirEntries = dirEntries.filter(entry => entry.isDirectory && !entry.name.startsWith('.'));
  // Make sure the directory is empty (except for dot directories)
  if (filteredDirEntries.length > 0) {
    throw new Error("Folder (directory) is not empty. Make sure you create a space in a new, empty folder");
  }

  const space = Space.newSpace(uuid());

  // Create space directory if it doesn't exist
  await mkdir(path, { recursive: true });

  // Create versioned space directory
  const versionedPath = path + '/space-v1';
  await mkdir(versionedPath, { recursive: true });

  // Create ops directory
  await mkdir(versionedPath + '/ops', { recursive: true });

  // Create supa.md file
  const readmeFile = await create(path + '/' + LOCAL_SPACE_MD_FILE);
  await readmeFile.write(new TextEncoder().encode(TEXT_INSIDE_LOCAL_SPACE_MD_FILE));

  // Create space.json with the space ID
  const spaceJsonFile = await create(versionedPath + '/space.json');
  await spaceJsonFile.write(new TextEncoder().encode(JSON.stringify({
    id: space.getId(),
  })));

  // Create a new space connection
  const sync = new LocalSpaceSync(space, path);

  // Get all operations that created the space tree
  const ops = space.tree.getAllOps();

  // Add ops to be saved
  sync.addOpsToSave(space.tree.root!.id, ops);

  // Connect to the space
  await sync.connect();

  return sync;
}

export async function loadLocalSpaceAndConnect(path: string): Promise<SpaceConnection> {
  const space = await loadLocalSpace(path);
  const sync = new LocalSpaceSync(space, path);
  await sync.connect();
  return sync;
}

export async function loadSpaceFromPointer(pointer: SpacePointer): Promise<SpaceConnection> {
  if (pointer.uri.startsWith("http")) {
    throw new Error("Remote spaces are not supported by local space sync. Use a different connection method.");
  }

  const space = await loadLocalSpace(pointer.uri);
  if (space.getId() !== pointer.id) {
    throw new Error("Space ID mismatch. Expected " + pointer.id + " but got " + space.getId());
  }

  const sync = new LocalSpaceSync(space, pointer.uri);
  await sync.connect();
  return sync;
}

/**
 * Loads a space from the current version path (v1)
 * @param basePath Base path to the space directory
 * @returns Promise that resolves with the loaded Space
 */
async function loadSpace(basePath: string): Promise<Space> {
  // Current version path is always space-v1
  const spacePath = `${basePath}/space-v1`;
  const spaceJsonPath = `${spacePath}/space.json`;
  
  if (!await exists(spaceJsonPath)) {
    throw new Error(`space.json not found in space-v1 structure`);
  }
  
  const spaceJson = await readTextFile(spaceJsonPath);
  
  // Get id from spaceJson
  const spaceData = JSON.parse(spaceJson);
  const spaceId = spaceData.id;
  
  if (!spaceId) {
    throw new Error("Space ID not found in space.json");
  }
  
  // Load space tree 
  const ops = await loadV1TreeOps(basePath, spaceId);
  
  if (ops.length === 0) {
    throw new Error("No operations found for space");
  }
  
  return new Space(new RepTree(uuid(), ops));
}

async function loadLocalSpace(path: string): Promise<Space> {
  try {
    const hasValidStructure = await containsSpaceVersionDir(path);
    if (!hasValidStructure) {
      throw new Error("Not a valid Supa space directory. Expected to find a space-v* directory.");
    }
    
    await migrateSpaceIfNeeded(path);
    // After migration (if any), load the space from the current version path
    return await loadSpace(path);
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to load space: ${error.message}`);
    } else {
      throw new Error('Failed to load space due to an unknown error');
    }
  }
}

function makePathForTree(spacePath: string, treeId: string): string {
  // We split the treeId into two parts to avoid having too many files in a single directory
  // If we use uuid v4, it will be 32 characters long, and the first 2 characters are random
  // e.g 6c/f4d84258bf43a6b88c631e06daa9ad
  const prefix = treeId.substring(0, 2);
  const suffix = treeId.substring(2);
  return `${spacePath}/space-v1/ops/${prefix}/${suffix}`;
}

function makePathForOpsBasedOnDate(spacePath: string, treeId: string, date: Date): string {
  // Use UTC date to ensure consistency across time zones
  const year = date.getUTCFullYear().toString();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${makePathForTree(spacePath, treeId)}/${year}/${month}/${day}`;
}

function makePathForCurrentDayOps(spacePath: string, treeId: string): string {
  // Create path based on current UTC date
  return makePathForOpsBasedOnDate(spacePath, treeId, new Date());
}

async function openFileToCurrentTreeOpsJSONLFile(spacePath: string, treeId: string, peerId: string): Promise<FileHandle> {
  const dirPath = makePathForCurrentDayOps(spacePath, treeId);
  await mkdir(dirPath, { recursive: true });

  const filePath = `${dirPath}/${peerId}.jsonl`;

  if (await exists(filePath)) {
    return await open(filePath, { append: true });
  }

  return await create(filePath);
}

/**
 * Loads all operations for a tree from the filesystem
 * @param spacePath Path to the space directory
 * @param treeId ID of the tree
 * @returns Array of operations
 */
async function loadAllTreeOps(spacePath: string, treeId: string): Promise<VertexOperation[]> {
  const treeOpsPath = makePathForTree(spacePath, treeId);

  // Check if directory exists
  if (!await exists(treeOpsPath)) {
    return [];
  }

  // Read all directories and get .jsonl files
  const dirEntries = await readDir(treeOpsPath);
  const datePaths: string[] = [];
  const jsonlFiles: string[] = [];

  for (const entry of dirEntries) {
    // Check for year directories
    if (entry.isDirectory && entry.name.match(/^\d{4}$/)) {
      const yearPath = treeOpsPath + '/' + entry.name;
      const monthEntries = await readDir(yearPath);

      for (const monthEntry of monthEntries) {
        if (monthEntry.isDirectory && monthEntry.name.match(/^\d{2}$/)) {
          const monthPath = yearPath + '/' + monthEntry.name;
          const dayEntries = await readDir(monthPath);

          for (const dayEntry of dayEntries) {
            if (dayEntry.isDirectory && dayEntry.name.match(/^\d{2}$/)) {
              datePaths.push(monthPath + '/' + dayEntry.name);
            }
          }
        }
      }
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
    try {
      const linesIterator = await readTextFileLines(file);
      const lines: string[] = [];
      for await (const line of linesIterator) {
        lines.push(line);
      }
      const peerId = file.split('/').pop()!.split('.')[0];
      const ops = await turnJSONLinesIntoOps(lines, peerId);
      allOps.push(...ops);
    } catch (error) {
      console.error("Error reading ops from file", file, error);
      // Continue with other files
    }
  }

  return allOps;
}

function turnOpsIntoJSONLines(ops: VertexOperation[]): string {
  let str = '';

  /*
  Each op is an array object on a separate line
  ["m",1,"node1","node2"]\n
  ["p",2,"node1","name","hello world"]\n
  */
  for (const op of ops) {
    if (isMoveVertexOp(op)) {
      // We save parentId like that because it might be null and we want to save null with quotes
      str += `["m",${op.id.counter},"${op.targetId}",${JSON.stringify(op.parentId)}]\n`;
    } else if (isAnyPropertyOp(op)) {
      // Convert undefined to empty object ({}) because JSON doesn't support undefined
      const value = op.value === undefined ? {} : op.value;
      str += `["p",${op.id.counter},"${op.targetId}","${op.key}",${JSON.stringify(value)}]\n`;
    }
  }

  return str;
}

export async function turnJSONLinesIntoOps(lines: string[], peerId: string): Promise<VertexOperation[]> {
  return new Promise((resolve, reject) => {
    const handleMessage = (e: MessageEvent) => {
      const { operations } = e.data as { operations: ParsedOp[] };
      const vertexOps = operations.map((op: ParsedOp) => {
        if (op.type === 'm') {
          return newMoveVertexOp(op.counter, op.peerId, op.targetId, op.parentId ?? null);
        } else {
          // Convert empty object ({}) to undefined
          const value = op.value && typeof op.value === 'object' && Object.keys(op.value).length === 0 ? undefined : op.value;
          return newSetVertexPropertyOp(op.counter, op.peerId, op.targetId, op.key!, value);
        }
      });
      opsParserWorker.removeEventListener('message', handleMessage);
      resolve(vertexOps);
    };

    opsParserWorker.addEventListener('message', handleMessage);
    opsParserWorker.postMessage({ lines, peerId });
  });
}