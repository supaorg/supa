import { OpId } from "./opId";

interface MoveNode {
  id: OpId;
  targetId: string;
  parentId: string | null;
}

interface SetProperty {
  id: OpId;
  key: string;
  value: string | number | boolean | string[] | number[] | boolean[];
}

type NodeOperation = MoveNode | SetProperty;

function isMoveNode(op: NodeOperation): op is MoveNode {
  return 'targetId' in op && 'parentId' in op;
}

function isSetProperty(op: NodeOperation): op is SetProperty {
  return 'key' in op && 'value' in op;
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