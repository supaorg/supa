import { OpId } from "./opId";
import { NodePropertyType } from "./replicatedTree";

interface MoveNode {
  id: OpId;
  targetId: string;
  parentId: string | null;
}

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

export function moveNode(id: OpId, targetId: string, parentId: string | null): MoveNode {
  return { id, targetId, parentId };
}

export function setNodeProperty(id: OpId, targetId: string, key: string, value: NodePropertyType): SetNodeProperty {
  return { id, targetId, key, value };
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