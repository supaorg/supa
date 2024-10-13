import { TreeNodeId, TreeNodeProperty } from "./treeTypes";

export class TreeNode {
  readonly id: string;
  parentId: TreeNodeId | null;
  private properties: TreeNodeProperty[];
  children: string[];

  constructor(id: string, parentId: TreeNodeId | null) {
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

  getProperty(key: string): TreeNodeProperty | undefined {
    return this.properties.find(p => p.key === key);
  }

  getAllProperties(): ReadonlyArray<TreeNodeProperty> {
    return this.properties;
  }

  removeProperty(key: string): void {
    this.properties = this.properties.filter(p => p.key !== key);
  }

  cloneWithNewParent(newParentId: TreeNodeId | null): TreeNode {
    const clonedNode = new TreeNode(this.id, newParentId);
    clonedNode.properties = [...this.properties];
    return clonedNode;
  }
}