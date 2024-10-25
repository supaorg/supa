import { ReplicatedTree } from "../replicatedTree/ReplicatedTree";
import AppTree from "./AppTree";

export default class Space {
	readonly tree: ReplicatedTree;
  private appTrees: Map<string, AppTree> = new Map();

  static isValid(tree: ReplicatedTree): boolean {
    const root = tree.getVertexByPath('/space');
    if (!root) {
      return false;
    }

    const apps = tree.getVertexByPath('/space/apps');
    if (!apps) {
      return false;
    }

    const chats = tree.getVertexByPath('/space/app-branches');
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

    const chats = tree.newVertex(rootId);
    tree.setVertexProperty(chats, '_n', 'app-branches');

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

    const appsTrees = this.tree.getVertexByPath('/space/app-branches');

    if (!appsTrees) {
      throw new Error("Apps trees vertex not found");
    }

    const newAppTree = this.tree.newVertex(appsTrees.id);

    this.tree.setVertexProperty(newAppTree, 'app-tree-id', appTree.getId());
    this.appTrees.set(appTree.getId(), appTree);

    return appTree;
  }

  getAppTree(appTreeId: string): AppTree | undefined {
    return this.appTrees.get(appTreeId);
  }

	createVertex() {
		
	}

	deleteVertex() {
		
	}

	setProps() {
		
	}
}