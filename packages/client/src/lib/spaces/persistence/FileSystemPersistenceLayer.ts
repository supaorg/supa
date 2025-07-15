import type { PersistenceLayer } from "@supa/core";
import type { VertexOperation } from "@supa/core";
import {
  isMoveVertexOp,
  isAnyPropertyOp,
  newMoveVertexOp,
  newSetVertexPropertyOp
} from "@supa/core";
import { appFs, type WatchEvent, type UnwatchFn, type FileHandle } from "../../appFs";
import { interval } from "@supa/core";

// Extract all the file system functions we need
const { 
  readDir, 
  create, 
  open, 
  mkdir, 
  readTextFile, 
  readTextFileLines, 
  writeTextFile, 
  watch, 
  exists 
} = appFs;

const opsParserWorker = new Worker(new URL('../opsParser.worker.ts', import.meta.url));

type ParsedOp = {
  type: 'm' | 'p';
  counter: number;
  peerId: string;
  targetId: string;
  parentId?: string;
  key?: string;
  value?: any;
};

export const LOCAL_SPACE_MD_FILE = 'supa.md';
export const TEXT_INSIDE_LOCAL_SPACE_MD_FILE = `# Supa Space

This directory contains a Supa space. Please do not rename or modify the 'space-v1' folder as you won't be able to open the space from Supa. Supa needs it as is.`;

/**
 * File system persistence layer that saves operations and secrets to local files.
 * Supports two-way sync on Tauri via file watching, one-way on web.
 */
export class FileSystemPersistenceLayer implements PersistenceLayer {
  readonly id: string;
  readonly type = 'local' as const;
  readonly supportsIncomingSync: boolean = true; // @TODO: delete this

  private _connected = false;
  private unwatchSpaceFsChanges: UnwatchFn | null = null;
  private saveOpsTimer: (() => void) | null = null;
  private savingOpsToFile = false;
  private treeOpsToSave = new Map<string, VertexOperation[]>();
  private saveOpsIntervalMs = 500;
  private saveSecretsTimer: (() => void) | null = null;
  private saveSecretsIntervalMs = 1000;
  private onIncomingOpsCallback: ((treeId: string, ops: VertexOperation[]) => void) | null = null;
  private currentPeerId: string | null = null;

  constructor(private spacePath: string, private spaceId: string) {
    this.id = `filesystem-${spaceId}`;
    this.supportsIncomingSync = true; // @TODO: delete this
  }

  async connect(): Promise<void> {
    if (this._connected) return;

    // Ensure space directory structure exists
    await this.ensureDirectoryStructure();

    this._connected = true;
  }

  async disconnect(): Promise<void> {
    if (!this._connected) return;

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

  async loadSpaceTreeOps(): Promise<VertexOperation[]> {
    if (!this._connected) {
      throw new Error('FileSystemPersistenceLayer not connected');
    }

    return await this.loadAllTreeOps(this.spaceId);
  }

  async saveTreeOps(treeId: string, ops: ReadonlyArray<VertexOperation>): Promise<void> {
    if (!this._connected) {
      throw new Error('FileSystemPersistenceLayer not connected');
    }

    if (ops.length === 0) return;

    // Filter out transient properties and add to save queue
    const opsToSave = ops.filter(op => !isAnyPropertyOp(op) || !op.transient);
    if (opsToSave.length === 0) return;

    this.addOpsToSave(treeId, opsToSave);

    // Start batched saving if not already started
    if (!this.saveOpsTimer) {
      this.saveOpsTimer = interval(() => this.saveOps(), this.saveOpsIntervalMs);
    }
  }

  async loadTreeOps(treeId: string): Promise<VertexOperation[]> {
    if (!this._connected) {
      throw new Error('FileSystemPersistenceLayer not connected');
    }

    return await this.loadAllTreeOps(treeId);
  }

  async loadSecrets(): Promise<Record<string, string> | undefined> {
    if (!this._connected) {
      throw new Error('FileSystemPersistenceLayer not connected');
    }

    return await this.readSecretsFromFile();
  }

  async saveSecrets(secrets: Record<string, string>): Promise<void> {
    if (!this._connected) {
      throw new Error('FileSystemPersistenceLayer not connected');
    }

    if (Object.keys(secrets).length === 0) return;

    await this.writeSecretsToFile(secrets);
  }

  async startListening?(onIncomingOps: (treeId: string, ops: VertexOperation[]) => void): Promise<void> {
    if (!this.supportsIncomingSync) {
      throw new Error('Two-way sync not supported on this platform');
    }

    this.onIncomingOpsCallback = onIncomingOps;

    try {
      this.unwatchSpaceFsChanges = await watch(
        this.spacePath,
        this.handleWatchEvent.bind(this),
        { recursive: true }
      );
    } catch (error) {
      console.error("Error setting up file watch:", error);
      throw error;
    }

    // Start periodic secret checking
    if (!this.saveSecretsTimer) {
      this.saveSecretsTimer = interval(() => this.checkIfSecretsNeedToBeSaved(), this.saveSecretsIntervalMs);
    }
  }

  async stopListening?(): Promise<void> {
    if (this.unwatchSpaceFsChanges) {
      this.unwatchSpaceFsChanges();
      this.unwatchSpaceFsChanges = null;
    }

    this.onIncomingOpsCallback = null;
  }

  // Set the current peer ID for filtering operations
  setPeerId(peerId: string): void {
    this.currentPeerId = peerId;
  }

  // Private methods extracted from OLD_LocalSpaceSync.ts

  private async ensureDirectoryStructure(): Promise<void> {
    // Create space directory if it doesn't exist
    await mkdir(this.spacePath, { recursive: true });

    // Create versioned space directory
    const versionedPath = this.spacePath + '/space-v1';
    await mkdir(versionedPath, { recursive: true });

    // Create ops directory
    await mkdir(versionedPath + '/ops', { recursive: true });

    // Create supa.md file if it doesn't exist
    const readmeFile = this.spacePath + '/' + LOCAL_SPACE_MD_FILE;
    if (!await exists(readmeFile)) {
      const file = await create(readmeFile);
      await file.write(new TextEncoder().encode(TEXT_INSIDE_LOCAL_SPACE_MD_FILE));
      await file.close();
    }

    // Create space.json with the space ID if it doesn't exist
    const spaceJsonFile = versionedPath + '/space.json';
    if (!await exists(spaceJsonFile)) {
      const file = await create(spaceJsonFile);
      await file.write(new TextEncoder().encode(JSON.stringify({
        id: this.spaceId,
      })));
      await file.close();
    }
  }

  private makePathForTree(treeId: string): string {
    // Split the treeId into two parts to avoid having too many files in a single directory
    const prefix = treeId.substring(0, 2);
    const suffix = treeId.substring(2);
    return `${this.spacePath}/space-v1/ops/${prefix}/${suffix}`;
  }

  private makePathForOpsBasedOnDate(treeId: string, date: Date): string {
    // Use UTC date to ensure consistency across time zones
    const year = date.getUTCFullYear().toString();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${this.makePathForTree(treeId)}/${year}/${month}/${day}`;
  }

  private makePathForCurrentDayOps(treeId: string): string {
    // Create path based on current UTC date
    return this.makePathForOpsBasedOnDate(treeId, new Date());
  }

  private async openFileToCurrentTreeOpsJSONLFile(treeId: string, peerId: string): Promise<FileHandle> {
    const dirPath = this.makePathForCurrentDayOps(treeId);
    await mkdir(dirPath, { recursive: true });

    const filePath = `${dirPath}/${peerId}.jsonl`;

    if (await exists(filePath)) {
      return await open(filePath, { append: true });
    }

    return await create(filePath);
  }

  /**
   * Load all the operations for a given tree.
   * @param treeId - The ID of the tree to load operations for.
   * @returns An array of VertexOperation objects.
   * @throws An error if the file is not a valid JSONL file.
   */
  private async loadAllTreeOps(treeId: string): Promise<VertexOperation[]> {
    const treeOpsPath = this.makePathForTree(treeId);

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

    // Sort datePaths so we read files from older to newer
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
        const ops = await this.turnJSONLinesIntoOps(lines, peerId);
        allOps.push(...ops);
      } catch (error) {
        console.error("Error reading ops from file", file, error);
        // Continue with other files
      }
    }

    return allOps;
  }

  private addOpsToSave(treeId: string, ops: ReadonlyArray<VertexOperation>) {
    let opsToSave = this.treeOpsToSave.get(treeId);
    if (!opsToSave) {
      opsToSave = [];
      this.treeOpsToSave.set(treeId, opsToSave);
    }
    opsToSave.push(...ops);
  }

  private async saveOps() {
    if (this.savingOpsToFile || !this.currentPeerId) {
      return;
    }

    this.savingOpsToFile = true;

    for (const [treeId, ops] of this.treeOpsToSave.entries()) {
      if (ops.length === 0) {
        continue;
      }

      // Let's split ops by their peerId
      const opsByPeerId = new Map<string, VertexOperation[]>();
      for (const op of ops) {
        const peerId = op.id.peerId;
        let opsForPeerId = opsByPeerId.get(peerId);
        if (!opsForPeerId) {
          opsForPeerId = [];
          opsByPeerId.set(peerId, opsForPeerId);
        }
        opsForPeerId.push(op);
      }

      // Save ops for each peerId
      for (const [peerId, opsForPeerId] of opsByPeerId.entries()) {
        try {
          const opsJSONLines = this.turnOpsIntoJSONLines(opsForPeerId);
          const opsFile = await this.openFileToCurrentTreeOpsJSONLFile(treeId, peerId);
          await opsFile.write(new TextEncoder().encode(opsJSONLines));
          this.treeOpsToSave.set(treeId, []);
          await opsFile.close();
        } catch (error) {
          console.error("Error saving ops to file", error);
        }
      }
    }

    this.savingOpsToFile = false;
  }

  private turnOpsIntoJSONLines(ops: VertexOperation[]): string {
    let str = '';

    for (const op of ops) {
      if (isMoveVertexOp(op)) {
        // Save parentId with quotes because it might be null
        str += `["m",${op.id.counter},"${op.targetId}",${JSON.stringify(op.parentId)}]\n`;
      } else if (isAnyPropertyOp(op)) {
        // Convert undefined to empty object ({}) because JSON doesn't support undefined
        const value = op.value === undefined ? {} : op.value;
        str += `["p",${op.id.counter},"${op.targetId}","${op.key}",${JSON.stringify(value)}]\n`;
      }
    }

    return str;
  }

  private async turnJSONLinesIntoOps(lines: string[], peerId: string): Promise<VertexOperation[]> {
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

  // Secrets encryption/decryption (preserved from OLD_LocalSpaceSync.ts)
  private async encryptSecrets(secretsObj: Record<string, string>, key: string): Promise<string> {
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

  private async decryptSecrets(encryptedData: string, key: string): Promise<Record<string, string>> {
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

  private async readSecretsFromFile(): Promise<Record<string, string> | undefined> {
    const secretsPath = this.spacePath + '/space-v1/secrets';

    if (!await exists(secretsPath)) {
      return undefined;
    }

    const encryptedData = await readTextFile(secretsPath);
    if (!encryptedData) {
      return undefined;
    }

    return await this.decryptSecrets(encryptedData, this.spaceId);
  }

  private async writeSecretsToFile(secrets: Record<string, string>) {
    const encryptedData = await this.encryptSecrets(secrets, this.spaceId);
    const secretsPath = this.spacePath + '/space-v1/secrets';
    await writeTextFile(secretsPath, encryptedData);
  }

  private async checkIfSecretsNeedToBeSaved() {
    // @TODO: Implement this
    // This method would need access to current secrets from the space
    // For now, we'll implement it when we integrate with SpaceManager
    // The old implementation compared current secrets with file secrets
  }

  // File watching event handler
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

  private async tryReadOpsFromPeer(path: string) {
    if (!this.onIncomingOpsCallback || !this.currentPeerId) {
      return;
    }

    let peerId: string | null = null;
    let treeId: string | null = null;

    try {
      const splitPath = path.split('/');

      // Extract peer ID from the filename (remove .jsonl extension)
      peerId = splitPath.pop()!.split('.')[0];

      if (!peerId) {
        throw new Error("Peer ID not found in the path");
      }

      // Skip if it's our own peer
      if (peerId === this.currentPeerId) {
        return;
      }

      // Extract tree ID from path structure
      const dayDir = splitPath.pop();
      if (!dayDir || !dayDir.match(/^\d{2}$/)) {
        throw new Error("Day directory not found in the path");
      }

      const monthDir = splitPath.pop();
      if (!monthDir || !monthDir.match(/^\d{2}$/)) {
        throw new Error("Month directory not found in the path");
      }

      const yearDir = splitPath.pop();
      if (!yearDir || !yearDir.match(/^\d{4}$/)) {
        throw new Error("Year directory not found in the path");
      }

      const treeIdEndPart = splitPath.pop();
      if (!treeIdEndPart) {
        throw new Error("Tree ID part 2 not found in the path");
      }

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

    const linesIterator = await readTextFileLines(path);
    const lines: string[] = [];
    for await (const line of linesIterator) {
      lines.push(line);
    }
    const ops = await this.turnJSONLinesIntoOps(lines, peerId);

    if (ops.length === 0) {
      return;
    }

    // Notify callback about incoming operations
    this.onIncomingOpsCallback(treeId, ops);
  }

  private async tryReadSecretsFromPeer(path: string) {
    // For now, we don't handle incoming secrets from file watching
    // This could be implemented later if needed
  }
}

// TODO: Implement migration functions later
// export async function migrateSpaceIfNeeded(path: string): Promise<void> {
//   // Migration logic will be implemented later
// } 