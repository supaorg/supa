import type { VertexState } from "./VertexState";
import type { ReplicatedTree } from "./ReplicatedTree";
import type { TreeVertexProperty, VertexChangeEvent, VertexPropertyType } from "./treeTypes";

/**
 * A wrapper class for TreeVertex that provides a more convenient API
 * for working with vertices in a ReplicatedTree.
 */
export class Vertex {
  constructor(
    private tree: ReplicatedTree,
    private state: VertexState
  ) { }

  get id(): string {
    return this.state.id;
  }

  get name(): string {
    //return this.state.name;
    throw new Error('Not implemented');
  }

  get path(): string {
    //return this.tree.getVertexPath(this.id);
    throw new Error('Not implemented');
  }

  get parentId(): string | null {
    return this.state.parentId;
  }

  get parent(): Vertex | undefined {
    if (!this.parentId) {
      return undefined;
    }

    return this.tree.getVertex(this.parentId);
  }

  get children(): Vertex[] {
    return this.tree.getChildren(this.id);
  }

  getChildrenAsTypedArray<T>(): T[] {
    return this.children.map(v => v.getProperties() as unknown as T);
  }

  newChild(props?: Record<string, VertexPropertyType> | object | null): Vertex {
    const typedProps = props as Record<string, VertexPropertyType> | null;
    return this.tree.newVertex(this.id, typedProps);
  }

  newNamedChild(name: string, props?: Record<string, VertexPropertyType> | object | null): Vertex {
    const typedProps = props as Record<string, VertexPropertyType> | null;
    return this.tree.newNamedVertex(this.id, name, typedProps);
  }

  setProperty(key: string, value: VertexPropertyType): void {
    this.tree.setVertexProperty(this.id, key, value);
  }

  setProperties(props: Record<string, VertexPropertyType> | object): void {
    const typedProps = props as Record<string, VertexPropertyType>;
    this.tree.setVertexProperties(this.id, typedProps);
  }

  getProperty(key: string): TreeVertexProperty | undefined {
    return this.tree.getVertexProperty(this.id, key);
  }

  getProperties(): Record<string, VertexPropertyType> {
    const props: Record<string, VertexPropertyType> = {};
    this.tree.getVertexProperties(this.id).forEach(p => {
      props[p.key] = p.value;
    });
    return props;
  }

  observe(listener: (event: VertexChangeEvent) => void): () => void {
    this.tree.subscribe(this.id, listener);
    return () => this.tree.unsubscribe(this.id, listener);
  }

  observeChildren(listener: (children: Vertex[]) => void): () => void {
    const wrappedListener = (event: VertexChangeEvent) => {
      if (event.type === 'children') {
        listener(this.children);
      }
    };
    this.tree.subscribe(this.id, wrappedListener);
    return () => this.tree.unsubscribe(this.id, wrappedListener);
  }

  observeChildrenAsTypedArray<T>(listener: (children: T[]) => void): () => void {
    return this.observeChildren((children) => {
      listener(children.map(c => c.getProperties() as unknown as T));
    });
  }

  delete(): void {
    this.tree.deleteVertex(this.id);
  }

  moveTo(parent: Vertex): void {
    this.tree.moveVertex(this.id, parent.id);
  }
} 