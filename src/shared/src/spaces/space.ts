import type { TreeVertex } from "../replicatedTree/TreeVertex";
import { ReplicatedTree } from "../replicatedTree/ReplicatedTree";
import AppTree from "./AppTree";
import type { AppConfig } from "@shared/models";
import type { VertexPropertyType } from "@shared/replicatedTree/treeTypes";

export default class Space {
	readonly tree: ReplicatedTree;
  private appTrees: Map<string, AppTree> = new Map();
  private newTreeObservers: ((treeId: string) => void)[] = [];
  private treeLoadObservers: ((treeId: string) => void)[] = [];
  private treeLoader: ((treeId: string) => Promise<AppTree | undefined>) | undefined;
  readonly appTreesVertex: TreeVertex;

  static isValid(tree: ReplicatedTree): boolean {
    /*
    // @TODO: check for _n equals 'space' of the root and version '0' instead
    const root = tree.getVertexByPath('space');
    if (!root) {
      return false;
    }
    */

    const apps = tree.getVertexByPath('app-configs');
    if (!apps) {
      return false;
    }

    const chats = tree.getVertexByPath('app-forest');
    if (!chats) { 
      return false;
    }

    return true;
  }

  static newSpace(peerId: string): Space {
    const tree = new ReplicatedTree(peerId);

    const rootId = tree.rootVertexId;

    tree.setVertexProperties(rootId, {
      '_n': 'space',
      'name': 'New Space',
      'version': '0',
      'needsSetup': true,
      'createdAt': new Date().toISOString(),
    });

    const apps = tree.newNamedVertex(rootId, 'app-configs');
    const appTrees = tree.newNamedVertex(rootId, 'app-forest');
    const providers = tree.newNamedVertex(rootId, 'providers');
    const settings = tree.newNamedVertex(rootId, 'settings');
    
    return new Space(tree);
  }

	constructor(tree: ReplicatedTree) {
		this.tree = tree;
  
    // @TODO: or perhaps a migration should be here
    if (!Space.isValid(tree)) {
      throw new Error("Invalid tree structure");
    }

    this.appTreesVertex = tree.getVertexByPath('app-forest') as TreeVertex;
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

    const appsTrees = this.tree.getVertexByPath('app-forest');

    if (!appsTrees) {
      throw new Error("Apps trees vertex not found");
    }

    const newAppTree = this.tree.newVertex(appsTrees.id);

    this.tree.setVertexProperty(newAppTree, 'tid', appTree.getId());
    this.appTrees.set(appTree.getId(), appTree);

    for (const listener of this.newTreeObservers) {
      listener(appTree.getId());
    }

    return appTree;
  }

  getVertex(vertexId: string): TreeVertex | undefined {
    return this.tree.getVertex(vertexId);
  }

  async loadAppTree(appTreeId: string): Promise<AppTree | undefined> {
    let appTree = this.appTrees.get(appTreeId);
    if (appTree) {
      return appTree;
    }

    if (!this.treeLoader) {
      throw new Error("No tree loader registered");
    }

    appTree = await this.treeLoader(appTreeId);
    if (appTree) {
      this.appTrees.set(appTreeId, appTree);

      for (const listener of this.treeLoadObservers) {
        listener(appTree.getId());
      }
    }

    return appTree;
  }

  observeNewAppTree(observer: (appTreeId: string) => void) {
    this.newTreeObservers.push(observer);
  }

  unobserveNewAppTree(observer: (appTreeId: string) => void) {
    this.newTreeObservers = this.newTreeObservers.filter(l => l !== observer);
  }

  observeTreeLoad(observer: (appTreeId: string) => void) {
    this.treeLoadObservers.push(observer);
  }

  unobserveTreeLoad(observer: (appTreeId: string) => void) {
    this.treeLoadObservers = this.treeLoadObservers.filter(l => l !== observer);
  }

  registerTreeLoader(loader: (appTreeId: string) => Promise<AppTree | undefined>) {
    this.treeLoader = loader;
  }

  getAppTree(appTreeId: string): AppTree | undefined {
    return this.appTrees.get(appTreeId);
  }

  getAppTreeIds(): ReadonlyArray<string> {
    return this.appTreesVertex.children;
  }

  getVertexIdReferencingAppTree(appTreeId: string): string | undefined {
    for (const vertexId of this.appTreesVertex.children) {
      const referencingVertex = this.tree.getVertex(vertexId);
      if (referencingVertex?.getProperty('tid')?.value === appTreeId) {
        return vertexId;
      }
    }

    return undefined;
  }

	createVertex() {
		
	}

	setProps() {
		
	}

  getVertexProperties<T extends object>(vertex: TreeVertex): T | null {
    const properties: Record<string, any> = {};
    
    // Get all property keys from type T
    const propertyKeys = Object.keys(this.getTypeProperties<T>());
    
    for (const key of propertyKeys) {
      const value = vertex.getProperty(key)?.value;
      if (value === undefined) return null;
      properties[key] = value;
    }
    
    return properties as T;
  }

  private getTypeProperties<T>(): Record<keyof T, null> {
    return {} as Record<keyof T, null>;
  }

  getArray<T extends object>(path: string): T[] {
    const vertex = this.tree.getVertexByPath(path);
    if (!vertex) return [];

    return vertex.children
      .map(vertexId => {
        const vertex = this.tree.getVertex(vertexId);
        if (!vertex) return null;
        return this.getVertexProperties<T>(vertex);
      })
      .filter((item): item is T => item !== null);
  }

  getAppConfigs(): AppConfig[] {
    return this.getArray<AppConfig>('app-configs');
  }

  insertIntoArray<T extends object>(path: string, item: T): string {
    const vertex = this.tree.getVertexByPath(path);
    if (!vertex) {
      throw new Error(`Path ${path} not found`);
    }

    const newVertex = this.tree.newVertex(vertex.id);
    
    // Set all properties from the item
    for (const [key, value] of Object.entries(item)) {
      this.tree.setVertexProperty(newVertex, key, value);
    }

    return newVertex;
  }

  updateInArray<T extends object>(vertexId: string, updates: Partial<T>): void {
    const vertex = this.tree.getVertex(vertexId);
    if (!vertex) {
      throw new Error(`Vertex ${vertexId} not found`);
    }

    // Update only the provided properties
    for (const [key, value] of Object.entries(updates)) {
      this.tree.setVertexProperty(vertex.id, key, value as VertexPropertyType);
    }
  }

  deleteVertex(vertexId: string): void {
    const vertex = this.tree.getVertex(vertexId);
    if (!vertex) {
      throw new Error(`Vertex ${vertexId} not found`);
    }

    this.tree.deleteVertex(vertexId);
  }

  // Example usage methods:
  addAppConfig(config: AppConfig): string {
    return this.insertIntoArray<AppConfig>('app-configs', config);
  }

  updateAppConfig(vertexId: string, updates: Partial<AppConfig>): void {
    this.updateInArray<AppConfig>(vertexId, updates);
  }

  deleteAppConfig(vertexId: string): void {
    this.deleteVertex(vertexId);
  }
}
