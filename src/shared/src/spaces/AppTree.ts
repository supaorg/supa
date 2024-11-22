import { ReplicatedTree } from "../replicatedTree/ReplicatedTree";

export default class AppTree {
  readonly tree: ReplicatedTree;

  static isValid(tree: ReplicatedTree): boolean {
    /*
    const root = tree.getVertexByPath('/app-tree');
    if (!root) {
      return false;
    }
    */

    return true;
  }

  static newAppTree(peerId: string, appId: string): AppTree {
    const tree = new ReplicatedTree(peerId);

    const rootId = tree.rootVertexId;

    tree.setVertexProperty(rootId, '_n', 'app-tree');
    tree.setVertexProperty(rootId, 'appId', appId);
    tree.setVertexProperty(rootId, 'createdAt', new Date().toISOString());

    return new AppTree(tree);
  }

  constructor(tree: ReplicatedTree) {
    this.tree = tree;

    if (!AppTree.isValid(tree)) {
      throw new Error("Invalid tree structure");
    }
  }

  getId(): string {
    return this.tree.rootVertexId;
  }

  getAppId(): string {
    const appId = this.tree.getVertexProperty(this.tree.rootVertexId, 'appId');
    if (!appId) {
      throw new Error("App ID is not set");
    }

    return appId.value as string;
  }

  getVersion(): string {
    const version = this.tree.getVertexProperty(this.tree.rootVertexId, 'version');
    if (!version) {
      throw new Error("Version is not set");
    }

    return version.value as string;
  }

  getCreatedAt(): Date {
    const createdAt = this.tree.getVertexProperty(this.tree.rootVertexId, 'createdAt');
    if (!createdAt) {
      throw new Error("App tree createdAt is not set");
    }

    return new Date(createdAt.value as string);
  }
}
