import { OpId } from "./OpId";

export type TreeNodeId = string;

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

type NodeChangeEventType = 'move' | 'property' | 'children';

export interface NodeChangeEvent {
  type: NodeChangeEventType;
  nodeId: TreeNodeId;
}

export type NodePropertyChangeEvent = NodeChangeEvent & {
  type: 'property';
  key: string;
  value: NodePropertyType | undefined;
}

export type NodeMoveEvent = NodeChangeEvent & {
  type: 'move';
  oldParentId: TreeNodeId;
  newParentId: TreeNodeId;
}

export type NodeChildrenChangeEvent = NodeChangeEvent & {
  type: 'children';
  children: TreeNode[];
}

export class TreeNode {
  readonly id: string;
  readonly parentId: TreeNodeId | null;
  private properties: TreeNodeProperty[];

  constructor(id: string, parentId: TreeNodeId | null) {
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

  cloneWithNewParent(newParentId: TreeNodeId | null): TreeNode {
    const clonedNode = new TreeNode(this.id, newParentId);
    this.properties.forEach(prop => {
      clonedNode.setProperty(prop.key, prop.value, prop.prevOpId);
    });
    return clonedNode;
  }
}