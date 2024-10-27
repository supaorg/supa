import type { TreeVertex } from "@shared/replicatedTree/TreeVertex";
import { ReplicatedTree } from "../replicatedTree/ReplicatedTree";
import AppTree from "./AppTree";

export default class Space {
	readonly tree: ReplicatedTree;
  private appTrees: Map<string, AppTree> = new Map();
  private newTreeListeners: ((treeId: string) => void)[] = [];
  private treeLoader: ((treeId: string) => Promise<AppTree>) | undefined;
  private appTreesVertex: TreeVertex;

  static isValid(tree: ReplicatedTree): boolean {
    const root = tree.getVertexByPath('/space');
    if (!root) {
      return false;
    }

    const apps = tree.getVertexByPath('/space/apps');
    if (!apps) {
      return false;
    }

    const chats = tree.getVertexByPath('/space/app-trees');
    if (!chats) { 
      return false;
    }

    return true;
  }

  static newSpace(peerId: string): Space {
    const tree = new ReplicatedTree(peerId);

    const rootId = tree.rootVertexId;

    tree.setVertexProperty(rootId, '_n', 'space');
    tree.setVertexProperty(rootId, 'name', 'New Space');
    tree.setVertexProperty(rootId, 'version', '0');
    tree.setVertexProperty(rootId, 'needsSetup', true);
    tree.setVertexProperty(rootId, 'createdAt', new Date().toISOString());

    const apps = tree.newVertex(rootId);
    tree.setVertexProperty(apps, '_n', 'apps');

    const appTrees = tree.newVertex(rootId);
    tree.setVertexProperty(appTrees, '_n', 'app-trees');

    const settings = tree.newVertex(rootId);
    tree.setVertexProperty(settings, '_n', 'settings');
    
    return new Space(tree);
  }

	constructor(tree: ReplicatedTree) {
		this.tree = tree;
  
    // @TODO: or perhaps a migration should be here
    if (!Space.isValid(tree)) {
      throw new Error("Invalid tree structure");
    }

    this.appTreesVertex = tree.getVertexByPath('/space/app-trees') as TreeVertex;
	}

  getId(): string {
    return this.tree.rootVertexId;
  }

  getName(): string {
    const name = this.tree.getVertexProperty(this.tree.rootVertexId, 'name');
    if (!name) {
      throw new Error("Space name is not set");
    }

    return name.value as string;
  }

  getCreatedAt(): Date {
    const createdAt = this.tree.getVertexProperty(this.tree.rootVertexId, 'createdAt');
    if (!createdAt) {
      throw new Error("Space createdAt is not set");
    }

    return new Date(createdAt.value as string);
  }

  newAppTree(appId: string): AppTree {
    const appTree = AppTree.newAppTree(this.tree.peerId, appId);

    const appsTrees = this.tree.getVertexByPath('/space/app-trees');

    if (!appsTrees) {
      throw new Error("Apps trees vertex not found");
    }

    const newAppTree = this.tree.newVertex(appsTrees.id);

    this.tree.setVertexProperty(newAppTree, 'tree-id', appTree.getId());
    this.appTrees.set(appTree.getId(), appTree);

    for (const listener of this.newTreeListeners) {
      listener(appTree.getId());
    }

    return appTree;
  }

  async loadAppTree(appTreeId: string): Promise<AppTree> {
    let appTree = this.appTrees.get(appTreeId);
    if (appTree) {
      return appTree;
    }

    if (!this.treeLoader) {
      throw new Error("No tree loader registered");
    }

    return this.treeLoader(appTreeId);
  }

  observeNewAppTree(listener: (appTreeId: string) => void) {
    this.newTreeListeners.push(listener);
  }

  unobserveNewAppTree(listener: (appTreeId: string) => void) {
    this.newTreeListeners = this.newTreeListeners.filter(l => l !== listener);
  }

  registerTreeLoader(loader: (appTreeId: string) => Promise<AppTree>) {
    this.treeLoader = loader;
  }

  getAppTree(appTreeId: string): AppTree | undefined {
    return this.appTrees.get(appTreeId);
  }

  getAppTreeIds(): ReadonlyArray<string> {
    console.log('appTreesVertex', this.appTreesVertex);

    return this.appTreesVertex.children;
  }

	createVertex() {
		
	}

	deleteVertex() {
		
	}

	setProps() {
		
	}
}