import { ReplicatedTree } from "../replicatedTree/ReplicatedTree";

export default class Space {
	readonly tree: ReplicatedTree;

  static isValidSpaceTree(tree: ReplicatedTree): boolean {
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
    if (!Space.isValidSpaceTree(tree)) {
      throw new Error("Invalid tree structure");
    }
	}

  getId(): string {
    return this.tree.rootVertexId;
  }

	createVertex() {
		
	}

	deleteVertex() {
		
	}

	setProps() {
		
	}
}