import { RepTree } from "../../../reptree/src/index";
import { VertexPropertyType } from "../../../reptree/src/index";

export class SpaceVertex {
  private tree: RepTree;
  readonly rootVertexId: string;

  constructor(tree: RepTree, rootVertexId: string) {
    this.tree = tree;
    this.rootVertexId = rootVertexId;
  }

  newChildVertex(): SpaceVertex {
    const vertex = this.tree.newVertex(this.rootVertexId);
    return new SpaceVertex(this.tree, vertex.id);
  }

  getProperty(key: string): VertexPropertyType | undefined {
    return this.tree.getVertexProperty(this.rootVertexId, key);
  }

  getProperties(): Record<string, VertexPropertyType> {
    return this.tree.getVertexProperties(this.rootVertexId).reduce((acc, property) => {
      acc[property.key] = property.value;
      return acc;
    }, {} as Record<string, VertexPropertyType>);
  }

  setProperty(key: string, value: VertexPropertyType): SpaceVertex {
    this.tree.setVertexProperty(this.rootVertexId, key, value);
    return this;
  }

  setProperties(properties: Record<string, VertexPropertyType>): SpaceVertex {
    for (const [key, value] of Object.entries(properties)) {
      this.setProperty(key, value);
    }
    return this;
  }
}
