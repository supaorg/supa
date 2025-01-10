import { ReplicatedTree } from "../replicatedTree/ReplicatedTree";
import AppTree from "./AppTree";
import type { AppConfig } from "../models";
import type { VertexPropertyType } from "../replicatedTree/treeTypes";
import type { ModelProviderConfig } from "../models";
import { validateKey } from "../tools/providerKeyValidators";
import { Vertex } from "../replicatedTree/Vertex";
import { AppConfigsData } from "./AppConfigsData";

export default class Space {
  readonly tree: ReplicatedTree;
  private secrets: Record<string, string> | undefined;
  private appTrees: Map<string, AppTree> = new Map();
  private newTreeObservers: ((treeId: string) => void)[] = [];
  private treeLoadObservers: ((treeId: string) => void)[] = [];
  private treeLoader: ((treeId: string) => Promise<AppTree | undefined>) | undefined;
  readonly appTreesVertex: Vertex;

  readonly appConfigs: AppConfigsData;

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
    const defaultConfig = Space.getDefaultAppConfig();
    tree.newVertex(apps.id, defaultConfig);

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

    this.appTreesVertex = tree.getVertexByPath('app-forest') as Vertex;

    this.appConfigs = new AppConfigsData(this.tree.getVertexByPath('app-configs')!);
  }

  getId(): string {
    return this.tree.rootVertexId;
  }

  get name(): string {
    const name = this.tree.getVertexProperty(this.tree.rootVertexId, 'name');
    if (!name) {
      throw new Error("Space name is not set");
    }

    return name as string;
  }

  set name(name: string) {
    this.tree.setVertexProperty(this.tree.rootVertexId, 'name', name);
  }

  getCreatedAt(): Date {
    const createdAt = this.tree.getVertexProperty(this.tree.rootVertexId, 'createdAt');
    if (!createdAt) {
      throw new Error("Space createdAt is not set");
    }

    return new Date(createdAt as string);
  }

  newAppTree(appId: string): AppTree {
    const appTree = AppTree.newAppTree(this.tree.peerId, appId);

    const appsTrees = this.tree.getVertexByPath('app-forest');

    if (!appsTrees) {
      throw new Error("Apps trees vertex not found");
    }

    const newAppTree = this.tree.newVertex(appsTrees.id);

    this.tree.setVertexProperty(newAppTree.id, 'tid', appTree.getId());
    this.appTrees.set(appTree.getId(), appTree);

    for (const listener of this.newTreeObservers) {
      listener(appTree.getId());
    }

    for (const listener of this.treeLoadObservers) {
      listener(appTree.getId());
    }

    return appTree;
  }

  setAppTreeName(appTreeId: string, name: string) {
    const vertex = this.getVertexReferencingAppTree(appTreeId);
    if (!vertex || vertex.name === name) return;

    vertex.name = name;
  }

  getVertex(vertexId: string): Vertex | undefined {
    return this.tree.getVertex(vertexId);
  }

  getVertexByPath(path: string): Vertex | undefined {
    return this.tree.getVertexByPath(path);
  }

  // @TODO: make part of Vertex
  findObjectWithPropertyAtPath(path: string, key: string, value: VertexPropertyType): object | undefined {
    const arr = this.getArray<object>(path);
    // Check if the object has the property and its value matches the given value
    return arr.find((obj: object) => {
      const typedObj = obj as Record<string, VertexPropertyType>;
      return typedObj[key] === value;
    });
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
    return this.appTreesVertex.children.map(v => v.id);
  }

  getAppTreeIdsSortedByCreatedAt(): ReadonlyArray<string> {
    const appTreeIds = this.getAppTreeIds();
    const appTreesWithDates = appTreeIds.map(id => {
      const appTree = this.getAppTree(id);
      return {
        id,
        createdAt: appTree?.getCreatedAt() ?? new Date(0)
      };
    });
    
    appTreesWithDates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return appTreesWithDates.map(item => item.id);
  }

  deleteAppTree(appTreeId: string) {
    const vertex = this.getVertexReferencingAppTree(appTreeId);
    if (!vertex) return;

    this.tree.deleteVertex(vertex.id);
  }

  getVertexReferencingAppTree(appTreeId: string): Vertex | undefined {
    for (const vertex of this.appTreesVertex.children) {
      if (vertex.getProperty('tid') === appTreeId) {
        return vertex;
      }
    }

    return undefined;
  }

  createVertex() {

  }

  setProps() {

  }

  getArray<T>(path: string): T[] {
    const vertex = this.tree.getVertexByPath(path);

    if (!vertex) return [];

    return this.vertexChildrenToTypedArray<T>(vertex);
  }

  private vertexChildrenToTypedArray<T>(vertex: Vertex): T[] {
    return vertex.children.map(child => {
      if (!child) return null;

      const properties = child.getProperties();
      return properties as unknown as T;
    }).filter((item): item is T => item !== null);
  }

  getAppConfigs(): AppConfig[] {
    return this.getArray<AppConfig>('app-configs');
  }

  observeAppConfigs(observer: (appConfigs: AppConfig[]) => void) {
    // @TODO: implement
    // observeChildrenAtVertex(this.tree.getVertexByPath('app-configs'), observer);
    // observeChildrenAtPath('app-configs', observer);
  }

  getAppConfig(configId: string): AppConfig | undefined {
    const config = this.findObjectWithPropertyAtPath('app-configs', 'id', configId);

    if (!config) return undefined;

    return config as AppConfig;
  }

  static getDefaultAppConfig(): AppConfig {
    return {
      id: "default",
      name: "Ask AI",
      button: "New query",
      description: "A basic chat assistant",
      instructions:
        "You are Supa, an advanced AI assistant with vast knowledge. Be direct in all responses. Do not spare the user's feelings. Cut niceties and filler words. Prioritize clear, concise communication over formality. Before replying, silently think about what the user says or what you are about to write. It is okay to make mistakes; ensure you review and correct yourself. Do the same for what you read—be critical and correct mistakes from users.",
    } as AppConfig;
  }

  // Get provider config and add API key from secrets if it's a cloud provider
  getModelProviderConfig(providerId: string): ModelProviderConfig | undefined {
    const config = this.getFirstObjectWithPropertyAtPath('providers', 'id', providerId) as ModelProviderConfig | undefined;

    if (config && config.type === 'cloud') {
      const apiKey = this.getServiceApiKey(providerId);
      if (apiKey) {
        config.apiKey = apiKey;
      }
    }

    return config;
  }

  getModelProviderConfigs(): ModelProviderConfig[] {
    const configs = this.getArray('providers') as ModelProviderConfig[];
    return configs.map(config => {
      if (config.type === 'cloud') {
        const apiKey = this.getServiceApiKey(config.id);
        if (apiKey) {
          return { ...config, apiKey };
        }
      }
      return config;
    });
  }

  deleteModelProviderConfig(providerId: string) {
    const providerVertex = this.getFirstVertexWithPropertyAtPath('providers', 'id', providerId);
    if (!providerVertex) return;

    this.tree.deleteVertex(providerVertex.id);
  }

  async getModelProviderStatus(targetLLMOrProvider: string): Promise<"valid" | "invalid" | "not-setup"> {
    const providerId = targetLLMOrProvider.split("/")[0];
    const config = this.getModelProviderConfig(providerId);

    if (!config) return "not-setup";

    if (config?.type === "cloud") {
      const apiKey = this.getServiceApiKey(providerId);
      if (!apiKey) return "not-setup";

      return await validateKey(providerId, apiKey) ? "valid" : "invalid";
    }

    return "valid";
  }

  insertIntoArray(path: string, item: object): Vertex {
    const vertex = this.tree.getVertexByPath(path);
    if (!vertex) {
      throw new Error(`Path ${path} not found`);
    }

    const newVertex = this.tree.newVertex(vertex.id);

    // Set all properties from the item
    for (const [key, value] of Object.entries(item)) {
      this.tree.setVertexProperty(newVertex.id, key, value as VertexPropertyType);
    }

    return newVertex;
  }

  getFirstVertexWithPropertyAtPath(path: string, key: string, value: VertexPropertyType): Vertex | undefined {
    const vertex = this.tree.getVertexByPath(path);
    if (!vertex) return undefined;

    for (const child of vertex.children) {
      const property = child.getProperty(key);
      if (property === value) {
        return child;
      }
    }

    return undefined;
  }

  getFirstObjectWithPropertyAtPath(path: string, key: string, value: VertexPropertyType): object | undefined {
    const vertex = this.getFirstVertexWithPropertyAtPath(path, key, value);
    if (!vertex) return undefined;

    return vertex.getProperties();
  }

  updateInArray(vertexId: string, updates: Partial<object>): void {
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
  addAppConfig(config: AppConfig): Vertex {
    return this.insertIntoArray('app-configs', config);
  }

  updateAppConfig(configId: string, updates: Partial<AppConfig>): void {
    const vertexId = this.getFirstVertexWithPropertyAtPath('app-configs', 'id', configId);
    if (!vertexId) {
      throw new Error(`App config ${configId} not found`);
    }

    this.updateInArray(vertexId.id, updates);
  }

  deleteAppConfig(vertexId: string): void {
    this.deleteVertex(vertexId);
  }

  // For cloud providers, store API key in secrets and remove from config
  saveModelProviderConfig(config: ModelProviderConfig) {
    if (config.type === 'cloud' && 'apiKey' in config) {
      const { apiKey, ...configWithoutKey } = config;
      this.setApiKey(config.id, apiKey);
      this.insertIntoArray('providers', configWithoutKey);
    } else {
      this.insertIntoArray('providers', config);
    }
  }

  getAllSecrets(): Record<string, string> | undefined {
    return this.secrets;
  }

  saveAllSecrets(secrets: Record<string, string>) {
    this.secrets = secrets;
  }

  getSecret(key: string): string | undefined {
    return this.secrets?.[key];
  }

  getServiceApiKey(provider: string): string | undefined {
    return this.secrets?.[`api-key-${provider}`];
  }

  setSecret(key: string, value: string) {
    if (!this.secrets) {
      this.secrets = {};
    }

    this.secrets[key] = value;
  }

  setApiKey(providerId: string, apiKey: string) {
    this.setSecret(`api-key-${providerId}`, apiKey);
  }
}
