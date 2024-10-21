import type { SpacePointer } from "./SpacePointer";
import Space from "@shared/spaces/Space";
import { ReplicatedTree } from "@shared/replicatedTree/ReplicatedTree";
import {
  readDir,
  exists,
  create,
  open,
  BaseDirectory,
  mkdir
} from "@tauri-apps/plugin-fs";
import { v4 as uuidv4 } from 'uuid';

export class LocalSpaceSync {
  constructor(readonly space: Space, private uri: string) { }

  getSpace(): Space {
    if (!this.space) {
      throw new Error("Space not loaded. Call connect() first.");
    }

    return this.space;
  }

  async connect(): Promise<Space> {
    const ops = await this.loadSpaceTreeFromPath(this.uri);

    this.space = new Space(ops);

    return this.space;
  }

  private async loadSpaceTreeFromPath(path: string): Promise<ReplicatedTree> {
    console.log('loadSpaceTreeFromPath', path);

    // check if space.json at path + /v1/space.json exists
    // then go to /v1/ops/ and load all op files
    // subscribe to changes in that folder and load new ops
    // subscribe to changes in space tree and save ops in the folder    

    //const path = uri.replace("file://", "");

    // @TODO: load ops from path
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

  const space = Space.newSpace(uuidv4());

  // Create space.json
  const pathToSpaceJson = path + '/space.json';
  const file = await create(pathToSpaceJson);
  await file.write(new TextEncoder().encode(JSON.stringify({
    id: space.getId(),
  })));

  // Create ops that created the space
  await saveTreeOpsFromScratch(space.tree, path);

  // @TODO: subscribe to changes in the ops folder

  return new LocalSpaceSync(space, path);
}

export async function loadLocalSpaceAndConnect(path: string): Promise<LocalSpaceSync> {
  const space = await loadLocalSpace(path);
  return new LocalSpaceSync(space, path);
}

export async function loadSpaceFromPointer(pointer: SpacePointer): Promise<LocalSpaceSync> {
  if (pointer.uri.startsWith("http")) {
    throw new Error("Remote spaces are not implemented yet");
  }
  
  const space = await loadLocalSpace(pointer.uri);
  if (space.getId() !== pointer.id) {
    throw new Error("Space ID mismatch. Expected " + pointer.id + " but got " + space.getId());
  }

  return new LocalSpaceSync(space, pointer.uri);
}

async function saveTreeOpsFromScratch(tree: ReplicatedTree, spacePath: string) {
  // Current date in YYYY-MM-DD format
  const date = new Date().toISOString().split('T')[0];

  // Path to tree is a guid split in 2 parts, with first 2 characters of the guid as the first folder name.
  // Eg f7/8f29f578fd42c9b31766f269998263
  const treePath = tree.rootVertexId.substring(0, 2) + '/' + tree.rootVertexId.substring(2);

  const opsPath = spacePath + '/ops/' + treePath + '/' + date + '/';
  await mkdir(opsPath, { recursive: true });

  // Save ops with a file name corresponding to peerId
  const opsFile = await create(opsPath + tree.peerId + '.ops');
  await opsFile.write(new TextEncoder().encode(JSON.stringify([])));
  await opsFile.close();
}

async function loadLocalSpace(path: string): Promise<Space> {
  // Check if the path exists
  // Check if the path is a directory and it has space.json file

  throw new Error("Not implemented");
}