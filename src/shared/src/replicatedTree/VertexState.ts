import type { TreeVertexId, TreeVertexProperty, VertexPropertyType } from "./treeTypes";

export class VertexState {
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
      if (value !== undefined) {
        // Update existing property
        this.properties[existingPropIndex] = { key, value };
      } else {
        // Remove existing property
        this.removeProperty(key);
      }
    } else {
      if (value !== undefined) {
        // Add new property
        this.properties.push({ key, value });
      }
    }
  }

  setTransientProperty(key: string, value: any): void {
    const existingPropIndex = this.transientProperties.findIndex(p => p.key === key);
    if (existingPropIndex !== -1) {
      if (value !== undefined) {
        // Update existing property
        this.transientProperties[existingPropIndex] = { key, value };
      } else {
        // Remove existing property
        this.removeTransientProperty(key);
      }
    } else {
      if (value !== undefined) {
        // Add new property
        this.transientProperties.push({ key, value });
      }
    }
  }

  getProperty(key: string): VertexPropertyType | undefined {
    const transientProp = this.transientProperties.find(p => p.key === key);
    if (transientProp) {
      return transientProp.value;
    }

    return this.properties.find(p => p.key === key)?.value;
  }

  getAllProperties(includingTransient: boolean = true): ReadonlyArray<TreeVertexProperty> {
    if (!includingTransient) {
      return this.properties;
    }

    const result: TreeVertexProperty[] = [];
    const seenKeys = new Set<string>();

    // Add transient properties first
    for (const prop of this.transientProperties) {
      result.push(prop);
      seenKeys.add(prop.key);
    }

    // Add permanent properties that don't have a transient override
    for (const prop of this.properties) {
      if (!seenKeys.has(prop.key)) {
        result.push(prop);
      }
    }

    return result;
  }

  removeProperty(key: string): void {
    this.properties = this.properties.filter(p => p.key !== key);
  }

  removeTransientProperty(key: string): void {
    this.transientProperties = this.transientProperties.filter(p => p.key !== key);
  }
}
