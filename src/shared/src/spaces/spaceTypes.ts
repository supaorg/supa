import { OpId } from "./OpId";

export type TreeNodeId = string | null | undefined;

export type TreeNodeType = {
  id: string;
  parentId: string | null;
}

export type NodePropertyType = string | number | boolean | string[] | number[] | boolean[];

export type TreeNodeProperty = {
  readonly key: string;
  readonly value: NodePropertyType;
  readonly prevOpId: OpId;
}

export class TreeNode {
  readonly id: string;
  readonly parentId: TreeNodeId;
  private properties: TreeNodeProperty[];

  constructor(id: string, parentId: TreeNodeId) {
    this.id = id;
    this.parentId = parentId;
    this.properties = [];
  }

  setProperty(key: string, value: any, opId: OpId): void {
    const existingPropIndex = this.properties.findIndex(p => p.key === key);
    if (existingPropIndex !== -1) {
      // Update existing property
      const prevOpId = this.properties[existingPropIndex].prevOpId;
      this.properties[existingPropIndex] = { key, value, prevOpId: opId };
    } else {
      // Add new property
      this.properties.push({ key, value, prevOpId: opId });
    }
  }

  getProperty(key: string): TreeNodeProperty | undefined {
    return this.properties.find(p => p.key === key);
  }

  getAllProperties(): ReadonlyArray<TreeNodeProperty> {
    return this.properties;
  }

  removeProperty(key: string): void {
    this.properties = this.properties.filter(p => p.key !== key);
  }

  clone(newParentId?: TreeNodeId): TreeNode {
    const clonedNode = new TreeNode(this.id, newParentId ?? this.parentId);
    this.properties.forEach(prop => {
      clonedNode.setProperty(prop.key, prop.value, prop.prevOpId);
    });
    return clonedNode;
  }
}