import { TreeNode } from "./TreeNode";

export type TreeNodeId = string;

export type NodePropertyType = string | number | boolean | string[] | number[] | boolean[];

export type TreeNodeProperty = {
  readonly key: string;
  readonly value: NodePropertyType;
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