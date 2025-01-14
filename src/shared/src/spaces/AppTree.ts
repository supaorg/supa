import { ReplicatedTree } from "../replicatedTree/ReplicatedTree";

type EventCallback = (event: any) => void;

export default class AppTree {
  readonly tree: ReplicatedTree;
  private eventCallbacks: Map<string, Set<EventCallback>> = new Map();

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

    return appId as string;
  }

  getVersion(): string {
    const version = this.tree.getVertexProperty(this.tree.rootVertexId, 'version');
    if (!version) {
      throw new Error("Version is not set");
    }

    return version as string;
  }

  get createdAt(): Date {
    const createdAt = this.tree.getVertexProperty(this.tree.rootVertexId, '_c');
    if (!createdAt) {
      throw new Error("App tree createdAt is not set");
    }

    return new Date(createdAt as string);
  }

  onEvent(eventName: string, callback: EventCallback): () => void {
    if (!this.eventCallbacks.has(eventName)) {
      this.eventCallbacks.set(eventName, new Set());
    }
    this.eventCallbacks.get(eventName)!.add(callback);
    return () => this.eventCallbacks.get(eventName)?.delete(callback);
  }

  triggerEvent(eventName: string, event: any) {
    const callbacks = this.eventCallbacks.get(eventName);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }
  }
}
