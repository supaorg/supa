import { OpId } from "./OpId";

export interface MoveNode {
  id: OpId;
  targetId: string;
  parentId: string | null;
  prevParentId: string | null;
}

export type NodePropertyType = string | number | boolean | string[] | number[] | boolean[];

interface SetNodeProperty {
  id: OpId;
  targetId: string;
  key: string;
  value: NodePropertyType;
}

export type NodeOperation = MoveNode | SetNodeProperty;

export function isMoveNode(op: NodeOperation): op is MoveNode {
  return 'parentId' in op;
}

export function isSetProperty(op: NodeOperation): op is SetNodeProperty {
  return 'key' in op;
}

export function moveNode(clock: number, peerId: string, targetId: string, parentId: string | null, oldParentId: string | null): MoveNode {
  return { id: new OpId(clock, peerId), targetId, parentId, prevParentId: oldParentId };
}

export function setNodeProperty(clock: number, peerId: string, targetId: string, key: string, value: NodePropertyType): SetNodeProperty {
  return { id: new OpId(clock, peerId), targetId, key, value };
}

/*

function handleOperation(op: NodeOperation) {
  if (isMoveNode(op)) {
    console.log(`Moving node ${op.id} to parent ${op.parentId}`);
  } else if (isSetProperty(op)) {
    console.log(`Setting property ${op.key} of node ${op.id} to ${op.value}`);
  }
}

// Example of creating operations
const moveOp: MoveNode = { id: new OpId(1, "peer1"), targetId: "target1", parentId: "parent1" };
const setProp: SetProperty = { id: new OpId(1, "peer2"), key: "color", value: "red" };

*/