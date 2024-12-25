import type { TreeVertexId, VertexChangeEvent, VertexPropertyChangeEvent, VertexChildrenChangeEvent, VertexMoveEvent } from "./treeTypes";
import { VertexState } from "./VertexState";

export class TreeState {
  private vertices: Map<TreeVertexId, VertexState>;
  private changeCallbacks: Map<TreeVertexId, Set<(event: VertexChangeEvent) => void>> = new Map();
  private globalChangeCallbacks: Set<(event: VertexChangeEvent) => void> = new Set();

  constructor() {
    this.vertices = new Map();
  }

  getAllVertices(): ReadonlyArray<VertexState> {
    return Array.from(this.vertices.values());
  }

  getVertex(id: string): VertexState | undefined {
    return this.vertices.get(id);
  }

  getChildrenIds(vertexId: TreeVertexId): string[] {
    return this.getVertex(vertexId)?.children ?? [];
  }

  getChildren(vertexId: TreeVertexId): VertexState[] {
    return this.getChildrenIds(vertexId)
      .map(id => {
        // Returning a copy so that the caller can't modify the vertex
        const vertex = this.vertices.get(id);
        return vertex ? vertex : undefined;
      })
      .filter(vertex => vertex !== undefined) as VertexState[];
  }

  moveVertex(vertexId: TreeVertexId, newParentId: TreeVertexId | null): VertexState {
    let vertex = this.getVertex(vertexId);
    const prevParentId = vertex ? vertex.parentId : undefined;
    if (!vertex) {
      vertex = new VertexState(vertexId, newParentId);
      this.vertices.set(vertexId, vertex);
    }

    if (prevParentId === newParentId) {
      return vertex;
    }

    vertex.parentId = newParentId;

    let childrenInNewParent: string[] | null = null;
    let childrenInOldParent: string[] | null = null;

    // Update children arrays in vertices
    if (prevParentId) {
      const oldParentVertex = this.getVertex(prevParentId);
      if (oldParentVertex) {
        oldParentVertex.children = oldParentVertex.children.filter(child => child !== vertexId);
        childrenInOldParent = oldParentVertex.children;
      } else {
        console.error(`Old parent vertex not found for ${prevParentId}`);
      }
    }

    if (newParentId !== null) {
      const newParentVertex = this.vertices.get(newParentId);
      if (newParentVertex) {
        newParentVertex.children.push(vertexId);
        childrenInNewParent = newParentVertex.children;
      } else {
        console.error(`New parent vertex not found for ${newParentId}`);
      }
    }

    // We notify the listeners in the end so that they have the final state of the tree

    this.notifyChange({
      type: 'move',
      vertexId: vertexId,
      oldParentId: prevParentId,
      newParentId,
    } as VertexMoveEvent);

    if (childrenInNewParent !== null && newParentId !== null) {
      this.notifyChange({
        type: 'children',
        vertexId: newParentId,
        children: childrenInNewParent.map(id => this.vertices.get(id)!),
      } as VertexChildrenChangeEvent);
    }

    if (childrenInOldParent !== null && prevParentId !== null) {
      this.notifyChange({
        type: 'children',
        vertexId: prevParentId,
        children: childrenInOldParent.map(id => this.vertices.get(id)!),
      } as VertexChildrenChangeEvent);
    }

    return vertex;
  }

  setProperty(vertexId: string, key: string, value: any) {
    const vertex = this.getVertex(vertexId);
    if (!vertex) {
      throw new Error(`Vertex ${vertexId} not found`);
    }

    vertex.setProperty(key, value);

    this.notifyChange({
      type: 'property',
      vertexId: vertexId,
      key,
      value,
    } as VertexPropertyChangeEvent);

    if (vertex.parentId !== null) {
      this.notifyChange({
        type: 'children',
        vertexId: vertex.parentId,
        children: [vertex],
      } as VertexChildrenChangeEvent);
    }
  }

  setTransientProperty(vertexId: string, key: string, value: any) {
    const vertex = this.getVertex(vertexId);
    if (vertex) {
      vertex.setTransientProperty(key, value);
    }

    // @TODO: add info that it's a transient property
    this.notifyChange({
      type: 'property',
      vertexId: vertexId,
      key,
      value,
    } as VertexPropertyChangeEvent);
  }

  addChangeCallback(vertexId: TreeVertexId | null, listener: (event: VertexChangeEvent) => void) {
    if (vertexId === null) {
      this.globalChangeCallbacks.add(listener);
    } else {
      if (!this.changeCallbacks.has(vertexId)) {
        this.changeCallbacks.set(vertexId, new Set());
      }
      this.changeCallbacks.get(vertexId)!.add(listener);
    }
  }

  removeChangeCallback(vertexId: TreeVertexId | null, listener: (event: VertexChangeEvent) => void) {
    if (vertexId === null) {
      this.globalChangeCallbacks.delete(listener);
    } else {
      this.changeCallbacks.get(vertexId)?.delete(listener);
    }
  }

  private notifyChange(event: VertexChangeEvent) {
    this.globalChangeCallbacks.forEach(listener => listener(event));
    this.changeCallbacks.get(event.vertexId)?.forEach(listener => listener(event));
  }

  printTree(vertexId: TreeVertexId, indent: string = "", isLast: boolean = true): string {
    const prefix = indent + (isLast ? "└── " : "├── ");
    let result = prefix + vertexId + "\n";

    let vertexName: string | null = null;

    if (vertexId !== null) {
      const vertex = this.getVertex(vertexId);
      if (vertex) {
        for (const prop of vertex.getAllProperties()) {
          if (prop.key === "_n") {
            vertexName = prop.value as string;
            //continue;
          }

          const propPrefix = indent + (isLast ? "    " : "│   ") + "• ";
          result += `${propPrefix}${prop.key}: ${JSON.stringify(prop.value)}\n`;
        }
      }
    }

    const children = this.getChildrenIds(vertexId);
    for (let i = 0; i < children.length; i++) {
      const childId = children[i];
      const isLastChild = i === children.length - 1;
      result += this.printTree(childId, indent + (isLast ? "    " : "│   "), isLastChild);
    }

    return result;
  }
}