import type { TreeVertexId, TreeVertexProperty } from "./treeTypes";

export class TreeVertex {
  readonly id: string;
  parentId: TreeVertexId | null;
  private properties: TreeVertexProperty[];
  children: string[];

  constructor(id: string, parentId: TreeVertexId | null) {
    this.id = id;
    this.parentId = parentId;
    this.properties = [];
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

  getProperty(key: string): TreeVertexProperty | undefined {
    return this.properties.find(p => p.key === key);
  }

  getAllProperties(): ReadonlyArray<TreeVertexProperty> {
    return this.properties;
  }

  removeProperty(key: string): void {
    this.properties = this.properties.filter(p => p.key !== key);
  }
}