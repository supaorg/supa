import { newMoveVertexOp, type MoveVertex, type SetVertexProperty, isMoveVertexOp, isSetProperty, type VertexOperation, newSetVertexPropertyOp } from "./operations";
import type { VertexPropertyType, TreeVertexProperty, VertexChangeEvent, TreeVertexId } from "./treeTypes";
import { TreeVertex } from "./TreeVertex";
import { TreeState } from "./TreeState";
import { OpId } from "./OpId";
import { v4 as uuidv4 } from "uuid";

type PropertyKeyAtVertexId = `${string}@${TreeVertexId}`;

/**
 * ReplicatedTree is a tree data structure for storing vertices with properties.
 * It uses CRDTs to manage seamless replication between peers.
 */
export class ReplicatedTree {
  readonly peerId: string;
  readonly rootVertexId: string;

  private lamportClock = 0;
  private state: TreeState;
  private moveOps: MoveVertex[] = [];
  private setPropertyOps: SetVertexProperty[] = [];
  private propertiesAndTheirOpIds: Map<PropertyKeyAtVertexId, OpId> = new Map();
  private localOps: VertexOperation[] = [];
  private pendingMovesWithMissingParent: Map<string, MoveVertex[]> = new Map();
  private pendingPropertiesWithMissingVertex: Map<string, SetVertexProperty[]> = new Map();
  private appliedOps: Set<string> = new Set();
  private parentIdBeforeMove: Map<OpId, string | null | undefined> = new Map();
  private opAppliedListeners: ((op: VertexOperation) => void)[] = [];

  constructor(peerId: string, ops: ReadonlyArray<VertexOperation> | null = null) {
    this.peerId = peerId;
    this.state = new TreeState();

    if (ops != null && ops.length > 0) {
      // Find a move op that has a parentId as null
      let rootMoveOp: MoveVertex | undefined;
      for (let i = 0; i < ops.length; i++) {
        if (isMoveVertexOp(ops[i]) && (ops[i] as MoveVertex).parentId === null) {
          rootMoveOp = ops[i] as MoveVertex;
          break;
        }
      }
      if (rootMoveOp) {
        this.rootVertexId = rootMoveOp.targetId;
      } else {
        throw new Error('The operations has to contain a move operation with a parentId as null to set the root vertex');
      }

      this.applyOps(ops);
    } else {
      // The root is our only vertex that will have a null parentId
      this.rootVertexId = this.newVertexInternal(null);
    }
  }

  getMoveOps(): ReadonlyArray<MoveVertex> {
    return this.moveOps;
  }

  getAllOps(): ReadonlyArray<VertexOperation> {
    return [...this.moveOps, ...this.setPropertyOps];
  }

  getVertex(vertexId: string): TreeVertex | undefined {
    return this.state.getVertex(vertexId);
  }

  getAllVertices(): ReadonlyArray<TreeVertex> {
    return this.state.getAllVertices();
  }

  getParent(vertexId: string): TreeVertex | undefined {
    const parentId = this.state.getVertex(vertexId)?.parentId;
    return parentId ? this.state.getVertex(parentId) : undefined;
  }

  getChildren(vertexId: string): TreeVertex[] {
    return this.state.getChildren(vertexId);
  }

  getChildrenIds(vertexId: string): string[] {
    return this.state.getChildrenIds(vertexId);
  }

  getAncestors(vertexId: string): TreeVertex[] {
    const ancestors: TreeVertex[] = [];
    let currentVertex = this.state.getVertex(vertexId);

    while (currentVertex && currentVertex.parentId) {
      const parentVertex = this.state.getVertex(currentVertex.parentId);
      if (parentVertex) {
        ancestors.push(parentVertex);
        currentVertex = parentVertex;
      } else {
        break;
      }
    }

    return ancestors;
  }

  getVertexProperty(vertexId: string, key: string): TreeVertexProperty | undefined {
    const vertex = this.state.getVertex(vertexId);
    if (!vertex) {
      return undefined;
    }

    return vertex.getProperty(key);
  }

  getVertexProperties(vertexId: string): Readonly<TreeVertexProperty[]> {
    const vertex = this.state.getVertex(vertexId);
    if (!vertex) {
      return [];
    }

    return vertex.getAllProperties();
  }

  popLocalOps(): VertexOperation[] {
    const ops = this.localOps;
    this.localOps = [];
    return ops;
  }

  private newVertexInternal(parentId: string | null): string {
    const vertexId = uuidv4();
    this.lamportClock++;
    // To create a vertex - we move a vertex with a fresh id under the parent.
    // No need to have a separate "create vertex" operation.
    const op = newMoveVertexOp(this.lamportClock, this.peerId, vertexId, parentId);
    this.localOps.push(op);
    this.applyMove(op);

    return vertexId;
  }

  newVertex(parentId: string): string {
    return this.newVertexInternal(parentId);
  }

  moveVertex(vertexId: string, parentId: string) {
    this.lamportClock++;
    const op = newMoveVertexOp(this.lamportClock, this.peerId, vertexId, parentId);
    this.localOps.push(op);
    this.applyMove(op);
  }

  setVertexProperty(vertexId: string, key: string, value: VertexPropertyType) {
    this.lamportClock++;
    const op = newSetVertexPropertyOp(this.lamportClock, this.peerId, vertexId, key, value);
    this.localOps.push(op);
    this.applyProperty(op);
  }

  getVertexByPath(path: string): TreeVertex | undefined {
    // Let's remove '/' at the start and at the end of the path
    path = path.replace(/^\/+/, '');
    path = path.replace(/\/+$/, '');

    const pathParts = path.split('/');

    const root = this.state.getVertex(this.rootVertexId);
    if (!root) {
      throw new Error('The root vertex is not found');
    }

    // First check the root vertex's property '_n'
    if (root.getProperty('_n')?.value === pathParts[0]) {
      return this.getVertexByPathArray(root, pathParts.slice(1));
    }

    return undefined;
  }

  getVertexByPathArray(vertex: TreeVertex, path: string[]): TreeVertex | undefined {
    if (path.length === 0) {
      return vertex ?? undefined;
    }

    const firstName = path[0];
    const rest = path.slice(1);

    // Now, search recursively by name '_n' in children until the path is empty or not found.
    const children = this.getChildren(vertex.id);
    for (const child of children) {
      if (child.getProperty('_n')?.value === firstName) {
        return this.getVertexByPathArray(child, rest);
      }
    }

    return undefined;
  }

  printTree() {
    return this.state.printTree(this.rootVertexId);
  }

  merge(ops: ReadonlyArray<VertexOperation>) {
    /*
    if (ops.length > 100) {
      this.applyOpsOptimizedForLotsOfMoves(ops);
    } else {
      this.applyOps(ops);
    }
    */

    this.applyOps(ops);
  }

  compareStructure(other: ReplicatedTree): boolean {
    return ReplicatedTree.compareVertices(this.rootVertexId, this, other);
  }

  compareMoveOps(other: ReplicatedTree): boolean {
    const movesA = this.moveOps;
    const movesB = other.getMoveOps();

    if (movesA.length !== movesB.length) {
      return false;
    }

    for (let i = 0; i < movesA.length; i++) {
      if (!OpId.equals(movesA[i].id, movesB[i].id)) {
        return false;
      }
    }

    return true;
  }

  static compareVertices(vertexId: string, treeA: ReplicatedTree, treeB: ReplicatedTree): boolean {
    const childrenA = treeA.state.getChildrenIds(vertexId);
    const childrenB = treeB.state.getChildrenIds(vertexId);

    if (childrenA.length !== childrenB.length) {
      return false;
    }

    // Compare properties of the current vertex
    if (vertexId !== null) {
      const propertiesA = treeA.getVertexProperties(vertexId);
      const propertiesB = treeB.getVertexProperties(vertexId);

      if (propertiesA.length !== propertiesB.length) {
        return false;
      }

      for (const propA of propertiesA) {
        const propB = propertiesB.find(p => p.key === propA.key);
        if (!propB || propA.value !== propB.value) {
          return false;
        }
      }
    }

    // Compare children and their properties recursively
    for (const childId of childrenA) {
      if (!childrenB.includes(childId)) {
        return false;
      }

      if (!ReplicatedTree.compareVertices(childId, treeA, treeB)) {
        return false;
      }
    }

    return true;
  }

  /** Updates the lamport clock with the counter value of the operation */
  private updateLamportClock(operation: VertexOperation): void {
    // This is how Lamport clock updates with a foreign operation that has a greater counter value.
    if (operation.id.counter > this.lamportClock) {
      this.lamportClock = operation.id.counter;
    }
  }

  private applyMove(op: MoveVertex) {
    // Check if a parent (unless we're dealing with the root vertex) exists for the move operation.
    // If it doesn't exist, stash the move op for later
    if (op.parentId !== null && !this.state.getVertex(op.parentId)) {
      if (!this.pendingMovesWithMissingParent.has(op.parentId)) {
        this.pendingMovesWithMissingParent.set(op.parentId, []);
      }
      this.pendingMovesWithMissingParent.get(op.parentId)!.push(op);
      return;
    }

    this.updateLamportClock(op);

    const lastOp = this.moveOps.length > 0 ? this.moveOps[this.moveOps.length - 1] : null;

    // If the new move is the newest - just try to move it. No conflict resolution is needed.
    if (lastOp === null || op.id.isGreaterThan(lastOp.id)) {
      this.moveOps.push(op);
      this.reportOpAsApplied(op);
      this.tryToMove(op);
    }
    // Here comes the core of the 'THE REPLICATED TREE ALGORITHM'.
    // From https://martin.kleppmann.com/papers/move-op.pdf
    // We undo all moves that are newer (based on the Lamport clock) than the target move, do the move, and then redo the moves.
    // The algorithm ensures that all replicas converge to the same tree after applying all operations.
    // The replicas are basically forced to apply the moves in the same order (by undo-do-redo).
    // So if a conflict or a cycle is introduced by some of the peers - the algorithm will resolve it.
    // tryToMove function has the logic to detect cycles and will ignore the move if it creates a cycle. 
    else {
      let targetIndex = this.moveOps.length;
      for (let i = this.moveOps.length - 1; i >= 0; i--) {
        const moveOp = this.moveOps[i];
        targetIndex = i;
        if (op.id.isGreaterThan(moveOp.id)) {
          break;
        }
        else {
          this.undoMove(moveOp);
        }
      }

      // Insert the op at the correct position
      this.moveOps.splice(targetIndex + 1, 0, op);
      this.reportOpAsApplied(op);
      this.tryToMove(op);

      // Redo all of the operations after the operation that we applied
      for (let i = targetIndex + 2; i < this.moveOps.length; i++) {
        this.tryToMove(this.moveOps[i]);
      }
    }

    // After applying the move, check if it unblocks any pending moves
    // We use targetId here because this vertex might now be a parent for pending operations
    this.applyPendingMovesForParent(op.targetId);
  }

  private reportOpAsApplied(op: VertexOperation) {
    this.appliedOps.add(op.id.toString());
    for (const listener of this.opAppliedListeners) {
      listener(op);
    }
  }

  private applyOps(ops: ReadonlyArray<VertexOperation>) {
    for (const op of ops) {
      if (this.appliedOps.has(op.id.toString())) {
        continue;
      }

      if (isMoveVertexOp(op)) {
        this.applyMove(op);
      } else if (isSetProperty(op)) {
        this.applyProperty(op);
      }
    }
  }

  /** Applies operations in an optimized way, sorting move ops by OpId to avoid undo-do-redo cycles */
  private applyOpsOptimizedForLotsOfMoves(ops: ReadonlyArray<VertexOperation>) {
    const newMoveOps = ops.filter(op => isMoveVertexOp(op) && !this.appliedOps.has(op.id.toString()));
    if (newMoveOps.length > 0) {
      // Clear the vertices

      // Get an array of all move ops (without already applied ones)
      const allMoveOps = [...this.moveOps, ...newMoveOps] as MoveVertex[];
      // The main point of this optimization is to apply the moves without undo-do-redo cycles (the conflict resolution algorithm).
      // That is why we sort by OpId.
      allMoveOps.sort((a, b) => OpId.compare(a.id, b.id));
      for (let i = 0, len = allMoveOps.length; i < len; i++) {
        const op = allMoveOps[i];
        this.applyMove(op);
      }
    }

    // Get an array of all property ops (without already applied ones)
    const propertyOps = ops.filter(op => isSetProperty(op) && !this.appliedOps.has(op.id.toString())) as SetVertexProperty[];
    for (let i = 0, len = propertyOps.length; i < len; i++) {
      const op = propertyOps[i];
      this.applyProperty(op);
    }
  }

  private applyPendingMovesForParent(parentId: string) {
    // If a parent doesn't exist, we can't apply pending moves yet.
    if (!this.state.getVertex(parentId)) {
      return;
    }

    const pendingMoves = this.pendingMovesWithMissingParent.get(parentId);
    if (!pendingMoves) {
      return;
    }

    this.pendingMovesWithMissingParent.delete(parentId);

    for (const pendingOp of pendingMoves) {
      this.applyMove(pendingOp);
    }
  }

  private tryToMove(op: MoveVertex) {
    let targetVertex = this.state.getVertex(op.targetId);

    if (targetVertex) {
      // We cache the parentId before the move operation.
      // We will use it to undo the move according to the move op algorithm.
      this.parentIdBeforeMove.set(op.id, targetVertex.parentId);
    }

    // If trying to move the target vertex under itself - do nothing
    if (op.targetId === op.parentId) return;

    // If we try to move the vertex (op.targetId) under one of its descendants (op.parentId) - do nothing
    if (op.parentId && this.isAncestor(op.parentId, op.targetId)) return;

    this.state.moveVertex(op.targetId, op.parentId);

    // If the vertex didn't exist before the move - see if it has pending properties
    // and apply them.
    if (!targetVertex) {
      const pendingProperties = this.pendingPropertiesWithMissingVertex.get(op.targetId) || [];
      for (const prop of pendingProperties) {
        this.setPropertyAndItsOpId(prop);
      }
    } 
  }

  private undoMove(op: MoveVertex) {
    const targetVertex = this.state.getVertex(op.targetId);
    if (!targetVertex) {
      console.error(`An attempt to undo move operation ${op.id.toString()} failed because the target vertex ${op.targetId} not found`);
      return;
    }

    const prevParentId = this.parentIdBeforeMove.get(op.id);
    if (prevParentId === undefined) {
      return;
    }

    this.state.moveVertex(op.targetId, prevParentId);
  }

  /** Checks if the given `ancestorId` is an ancestor of `childId` in the tree */
  isAncestor(childId: string, ancestorId: string | null): boolean {
    let targetId = childId;
    let vertex: TreeVertex | undefined;

    const maxDepth = 1000;
    let depth = 0;

    while ((vertex = this.state.getVertex(targetId))) {
      if (vertex.parentId === ancestorId) return true;
      if (!vertex.parentId) return false;

      if (depth > maxDepth) {
        console.error(`isAncestor: max depth of ${maxDepth} reached. Perhaps, we have an infinite loop here.`);
        return true;
      }

      targetId = vertex.parentId;
      depth++;
    }

    return false;
  }

  private setPropertyAndItsOpId(op: SetVertexProperty) {
    this.propertiesAndTheirOpIds.set(`${op.key}@${op.targetId}`, op.id);
    this.state.setProperty(op.targetId, op.key, op.value);
    this.reportOpAsApplied(op);
  }

  private applyProperty(op: SetVertexProperty) {
    const targetVertex = this.state.getVertex(op.targetId);
    if (!targetVertex) {
      if (!this.pendingPropertiesWithMissingVertex.has(op.targetId)) {
        this.pendingPropertiesWithMissingVertex.set(op.targetId, []);
      }
      this.pendingPropertiesWithMissingVertex.get(op.targetId)!.push(op);
      return;
    }

    this.updateLamportClock(op);

    const prevProp = targetVertex.getProperty(op.key);

    const prevOpId = this.propertiesAndTheirOpIds.get(`${op.key}@${op.targetId}`);

    this.setPropertyOps.push(op);

    // Apply the property if it's not already applied or if the current op is newer
    // This is the last writer wins approach that ensures the same state between replicas.
    if (!prevProp || (prevOpId && op.id.isGreaterThan(prevOpId))) {
      this.setPropertyAndItsOpId(op);
    }
  }

  subscribe(vertexId: string | null, listener: (event: VertexChangeEvent) => void) {
    this.state.addChangeListener(vertexId, listener);
  }

  unsubscribe(vertexId: string | null, listener: (event: VertexChangeEvent) => void) {
    this.state.removeChangeListener(vertexId, listener);
  }

  subscribeToOpApplied(listener: (op: VertexOperation) => void) {
    this.opAppliedListeners.push(listener);
  }

  unsubscribeFromOpApplied(listener: (op: VertexOperation) => void) {
    this.opAppliedListeners = this.opAppliedListeners.filter(l => l !== listener);
  }
}