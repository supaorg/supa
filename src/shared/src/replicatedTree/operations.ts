import { OpId } from "./OpId";
import { type VertexPropertyType } from "./treeTypes";

export interface MoveVertex {
  id: OpId;
  targetId: string;
  parentId: string | null;
}

export interface SetVertexProperty {
  id: OpId;
  targetId: string;
  key: string;
  value: VertexPropertyType;
}

export type VertexOperation = MoveVertex | SetVertexProperty;

export function isMoveVertexOp(op: VertexOperation): op is MoveVertex {
  return 'parentId' in op;
}

export function isSetProperty(op: VertexOperation): op is SetVertexProperty {
  return 'key' in op;
}

export function newMoveVertexOp(clock: number, peerId: string, targetId: string, parentId: string | null): MoveVertex {
  return { id: new OpId(clock, peerId), targetId, parentId };
}

export function newSetVertexPropertyOp(clock: number, peerId: string, targetId: string, key: string, value: VertexPropertyType): SetVertexProperty {
  return { id: new OpId(clock, peerId), targetId, key, value };
}