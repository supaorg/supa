import { ReplicatedTree } from "../replicatedTree/ReplicatedTree";

export class Space {
	readonly tree: ReplicatedTree;

  static isValidSpaceTree(tree: ReplicatedTree): boolean {
    
    const spaceNode = tree.getNodeByPath('/space');
    if (!spaceNode) {
      return false;
    }

    const apps = tree.getNodeByPath('/space/apps');
    if (!apps) {
      return false;
    }

    const chats = tree.getNodeByPath('/space/app-branches');
    if (!chats) { 
      return false;
    }

    return true;
  }

  static newSpace(peerId: string): Space {
    const tree = new ReplicatedTree(peerId);

    const rootId = tree.newNode();

    tree.setNodeProperty(rootId, '_n', 'space');
    tree.setNodeProperty(rootId, 'name', 'New Space');
    tree.setNodeProperty(rootId, 'version', '0');

    const apps = tree.newNode(rootId);
    tree.setNodeProperty(apps, '_n', 'apps');

    const chats = tree.newNode(rootId);
    tree.setNodeProperty(chats, '_n', 'app-branches');

    const settings = tree.newNode(rootId);
    tree.setNodeProperty(settings, '_n', 'settings');
    
    return new Space(tree);
  }

	constructor(tree: ReplicatedTree) {
		this.tree = tree;
  
    // @TODO: or perhaps a migration should be here
    if (!Space.isValidSpaceTree(tree)) {
      throw new Error("Invalid tree structure");
    }
	}

	async createNode(): Promise<void> {
		
	}

	async deleteNode(): Promise<void> {
		
	}

	async setProps(): Promise<void> {
		
	}
}

export default Space;

