import type { AppConfig } from "@shared/models";
import type { Vertex } from "@shared/replicatedTree/Vertex";
import type Space from "@shared/spaces/Space";

// @TODO: answer: should I resolve 'id' into vertex id? And same for _n to 'name'?

// @TODO: could it be based on a generic data class? SpaceArray<T>(rootVertex: Vertex)
export class AppConfigsData {
  private root: Vertex;

  constructor(root: Vertex) {
    this.root = root;

    if (!this.root) {
      throw new Error("App configs vertex not found");
    }
  }

  getAll(): AppConfig[] {
    return this.root.getChildrenAsTypedArray<AppConfig>();
  }

  get(configId: string): AppConfig | undefined {
    return this.root.findFirstTypedChildWithProperty<AppConfig>("id", configId);
  }

  // @TODO: consider adding automatically
  add(config: AppConfig) {
    // @TODO: Require ID

    this.root.newChild({
      id: config.id,
      name: config.name,
      description: config.description,
      instructions: config.instructions,
      targetLLM: config.targetLLM,
    });
  }

  update(id: string, updates: Partial<AppConfig>) {
    const targetVertex = this.root.findFirstChildVertexWithProperty("id", id);
    if (!targetVertex) {
      throw new Error(`App config ${id} not found`);
    }

    targetVertex.setProperties(updates);
  }

  delete(configId: string) {
    const vertex = this.root.findFirstChildVertexWithProperty("id", configId);
    if (!vertex) {
      throw new Error(`App config ${configId} not found`);
    }

    this.root.delete();
  }

  observe(observer: (appConfigs: AppConfig[]) => void) {
    observer(this.getAll());
    return this.root.observeChildrenAsTypedArray(observer);
  }
}
