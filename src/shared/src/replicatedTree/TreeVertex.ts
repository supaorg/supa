import type { TreeVertexId, TreeVertexProperty } from "./treeTypes";

// @TODO: rename to VertexState
export class TreeVertex {
  readonly id: string;
  parentId: TreeVertexId | null;
  private properties: TreeVertexProperty[];
  private transientProperties: TreeVertexProperty[];
  children: string[];

  constructor(id: string, parentId: TreeVertexId | null) {
    this.id = id;
    this.parentId = parentId;
    this.properties = [];
    this.transientProperties = [];
    this.children = [];
  }

  setProperty(key: string, value: any): void {
    const existingPropIndex = this.properties.findIndex(p => p.key === key);
    if (existingPropIndex !== -1) {
      // Update existing property
      this.properties[existingPropIndex] = { key, value };
    } else {
      // Add new property
      this.properties.push({ key, value });
    }
  }

  setTransientProperty(key: string, value: any): void {
    const existingPropIndex = this.transientProperties.findIndex(p => p.key === key);
    if (existingPropIndex !== -1) {
      this.transientProperties[existingPropIndex] = { key, value };
    } else {
      this.transientProperties.push({ key, value });
    }
  }

  getProperty(key: string): TreeVertexProperty | undefined {
    const transientProp = this.transientProperties.find(p => p.key === key);
    if (transientProp) {
      return transientProp;
    }

    return this.properties.find(p => p.key === key);
  }

  getAllProperties(): ReadonlyArray<TreeVertexProperty> {
    return this.properties;
  }

  removeProperty(key: string): void {
    this.properties = this.properties.filter(p => p.key !== key);
  }

  removeTransientProperty(key: string): void {
    this.transientProperties = this.transientProperties.filter(p => p.key !== key);
  }
}
