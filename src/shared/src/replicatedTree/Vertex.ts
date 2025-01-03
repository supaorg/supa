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

  get name(): string | undefined {
    return this.getProperty('_n') as string | undefined;
  }

  set name(name: string) {
    this.tree.setVertexProperty(this.id, '_n', name);
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

  getAsTypedObject<T>(): T {
    return this.getProperties() as T;
  }

  getChildrenAsTypedArray<T>(): T[] {
    return this.children.map(v => v.getAsTypedObject<T>());
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

  getProperty(key: string): VertexPropertyType | undefined {
    return this.tree.getVertexProperty(this.id, key);
  }

  getProperties(): Record<string, VertexPropertyType> {
    const props: Record<string, VertexPropertyType> = {};
    this.tree.getVertexProperties(this.id).forEach(p => {
      props[p.key] = p.value;
    });
    return props;
  }

  findAllChildrenWithProperty(key: string, value: VertexPropertyType): Vertex[] {
    return this.children.filter(c => c.getProperty(key) === value);
  }

  findFirstChildVertexWithProperty(key: string, value: VertexPropertyType): Vertex | undefined {
    return this.children.find(c => c.getProperty(key) === value);
  }

  findFirstTypedChildWithProperty<T>(key: string, value: VertexPropertyType): T | undefined {
    return this.findFirstChildVertexWithProperty(key, value)?.getAsTypedObject<T>();
  }

  findAllTypedChildrenWithProperty<T>(key: string, value: VertexPropertyType): T[] {
    return this.findAllChildrenWithProperty(key, value).map(c => c.getAsTypedObject<T>());
  }

  observe(listener: (events: VertexChangeEvent[]) => void): () => void {
    const unobserve = this.tree.observe(this.id, listener);
    return () => unobserve();
  }

  observeChildren(listener: (children: Vertex[]) => void): () => void {
    const unobserve = this.tree.observe(this.id, (events: VertexChangeEvent[]) => {
      if (events.some(e => e.type === 'children')) {
        listener(this.children);
      }
    });
    return () => unobserve();
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