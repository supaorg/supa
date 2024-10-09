import { v4 as uuidv4 } from "uuid";
import { moveNode, type MoveNode, type SetNodeProperty, isMoveNode, isSetProperty, type NodeOperation, setNodeProperty } from "./operations";
import { NodePropertyType, TreeNode, TreeNodeProperty, NodeChangeEvent } from "./treeTypes";
import { SimpleTreeNodeStore } from "./SimpleTreeNodeStore";
import { OpId } from "./OpId";

/**
 * ReplicatedTree is a tree data structure that allows to replicate it between peers.
 * It uses CRDTs to manage sync between nodes and properties.
 */
export class ReplicatedTree {
  readonly peerId: string;

  private lamportClock = 0;
  private store: SimpleTreeNodeStore;
  private moveOps: MoveNode[] = [];
  private localOps: NodeOperation[] = [];
  private pendingMovesWithMissingParent: Map<string, MoveNode[]> = new Map();
  private pendingPropertiesWithMissingNode: Map<string, SetNodeProperty[]> = new Map();
  private appliedOps: Set<string> = new Set();
  private opAppliedListeners: ((op: NodeOperation) => void)[] = [];

  constructor(peerId: string, ops: NodeOperation[] | null = null) {
    this.peerId = peerId;
    this.store = new SimpleTreeNodeStore();

    if (ops != null && ops.length > 0) {
      this.applyOps(ops);
    }
  }

  getMoveOps(): MoveNode[] {
    return this.moveOps;
  }

  getNode(nodeId: string): TreeNode | undefined {
    return this.store.get(nodeId);
  }

  getParent(nodeId: string): TreeNode | undefined {
    const parentId = this.store.get(nodeId)?.parentId;
    return parentId ? this.store.get(parentId) : undefined;
  }

  getChildren(nodeId: string | null): TreeNode[] {
    return this.store.getChildren(nodeId);
  }

  getAncestors(nodeId: string): TreeNode[] {
    const ancestors: TreeNode[] = [];
    let currentNode = this.store.get(nodeId);

    while (currentNode && currentNode.parentId) {
      const parentNode = this.store.get(currentNode.parentId);
      if (parentNode) {
        ancestors.push(parentNode);
        currentNode = parentNode;
      } else {
        break;
      }
    }

    return ancestors;
  }

  getNodeProperty(nodeId: string, key: string): TreeNodeProperty | undefined {
    const node = this.store.get(nodeId);

    if (!node) {
      return undefined;
    }

    return node.getProperty(key);
  }

  getNodeProperties(nodeId: string): Readonly<TreeNodeProperty[]> {
    const node = this.store.get(nodeId);

    if (!node) {
      return [];
    }

    return node.getAllProperties();
  }

  popLocalOps(): NodeOperation[] {
    const ops = this.localOps;
    this.localOps = [];
    return ops;
  }

  newNode(parentId: string | null = null): string {
    // To create a node - we move a node with a fresh id under the parent.
    // No need to have a separate "create node" operation.
    const nodeId = uuidv4();
    this.lamportClock++;
    const op = moveNode(this.lamportClock, this.peerId, nodeId, parentId, null);
    this.localOps.push(op);
    this.applyMove(op);

    return nodeId;
  }

  move(nodeId: string, parentId: string | null) {
    const node = this.store.get(nodeId);
    this.lamportClock++;
    const op = moveNode(this.lamportClock, this.peerId, nodeId, parentId, node?.parentId ?? null);
    this.localOps.push(op);
    this.applyMove(op);
  }

  setNodeProperty(nodeId: string, key: string, value: NodePropertyType) {
    this.lamportClock++;
    const op = setNodeProperty(this.lamportClock, this.peerId, nodeId, key, value);
    this.localOps.push(op);
    this.applyProperty(op);
  }

  getNodeByPath(path: string): TreeNode | undefined {
    // Let's remove '/' at the start and at the end of the path
    path = path.replace(/^\/+/, '');
    path = path.replace(/\/+$/, '');

    const pathParts = path.split('/');

    return this.getNodeByPathArray(null, pathParts);
  }

  getNodeByPathArray(currentNode: TreeNode | null, path: string[]): TreeNode | undefined {
    if (path.length === 0) {
      return currentNode ?? undefined;
    }

    const firstName = path[0];
    const rest = path.slice(1);

    // Now, search recursively by name '_n' in children until the path is empty or not found.
    const children = this.getChildren(currentNode ? currentNode.id : null);
    for (const child of children) {
      if (child.getProperty('_n')?.value === firstName) {
        return this.getNodeByPathArray(child, rest);
      }
    }

    return undefined;
  }

  printTree() {
    return this.store.printTree(null);
  }

  merge(ops: NodeOperation[]) {
    this.applyOps(ops);
  }

  compareStructure(other: ReplicatedTree): boolean {
    return ReplicatedTree.compareNodes(null, this, other);
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



  static compareNodes(nodeId: string | null, treeA: ReplicatedTree, treeB: ReplicatedTree): boolean {
    const childrenA = treeA.store.getChildrenIds(nodeId);
    const childrenB = treeB.store.getChildrenIds(nodeId);

    if (childrenA.length !== childrenB.length) {
      return false;
    }

    // Compare properties of the current node
    if (nodeId !== null) {
      const propertiesA = treeA.getNodeProperties(nodeId);
      const propertiesB = treeB.getNodeProperties(nodeId);

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

      if (!ReplicatedTree.compareNodes(childId, treeA, treeB)) {
        return false;
      }
    }

    return true;
  }

  private updateLamportClock(operation: NodeOperation): void {
    // This is how Lamport clock updates with a foreign operation that has a greater counter value.
    if (operation.id.counter > this.lamportClock) {
      this.lamportClock = operation.id.counter;
    }
  }

  private applyMove(op: MoveNode) {
    // Check if a parent (unless it's the root - 'null') exists for the move operation.
    // If it doesn't exist, stash the move op for later
    if (op.parentId !== null && !this.store.get(op.parentId)) {
      if (!this.pendingMovesWithMissingParent.has(op.parentId)) {
        this.pendingMovesWithMissingParent.set(op.parentId, []);
      }
      this.pendingMovesWithMissingParent.get(op.parentId)!.push(op);
      return;
    }

    this.updateLamportClock(op);

    if (this.moveOps.length === 0) {
      this.moveOps.push(op);
      this.tryToMove(op);
      this.applyPendingMovesForParent(op.targetId);
      return;
    }

    const lastOp = this.moveOps[this.moveOps.length - 1];

    if (op.id.isGreaterThan(lastOp.id)) {
      this.moveOps.push(op);
      this.reportOpAsApplied(op);
      this.tryToMove(op);
    } else {
      // Here comes the core of the 'THE REPLICATED TREE ALGORITHM'.
      // From https://martin.kleppmann.com/papers/move-op.pdf
      // We undo all moves that are newer (based on the Lamport clock) than the target move, do the move, and then redo the 'recent' moves.
      // The algorithm ensures that all replicas converge to the same tree after applying all operations.
      // The replicas are basically forced to apply the moves in the same order (by undo-do-redo).
      // So if a conflict or a cycle is introduced by some of the peers - the algorithm will resolve it.
      // tryToMove function has the logic to detect cycles and will ignore the move if it creates a cycle.
      const opsToRedo: MoveNode[] = [];
      let insertIndex = this.moveOps.length;
      for (let i = this.moveOps.length - 1; i >= 0; i--) {
        const moveOp = this.moveOps[i];
        if (op.id.isGreaterThan(moveOp.id)) {
          insertIndex = i + 1;
          break;
        } else {
          this.undoMove(moveOp);
          opsToRedo.unshift(moveOp);
        }
      }

      // Insert the op at the correct position
      this.moveOps.splice(insertIndex, 0, op);
      this.reportOpAsApplied(op);
      this.tryToMove(op);

      // Redo the operations
      for (const moveOp of opsToRedo) {
        this.tryToMove(moveOp);
      }
    }

    // After applying the move, check if it unblocks any pending moves
    // We use targetId here because this node might now be a parent for pending operations
    this.applyPendingMovesForParent(op.targetId);
  }

  private reportOpAsApplied(op: NodeOperation) {
    this.appliedOps.add(op.id.toString());
    for (const listener of this.opAppliedListeners) {
      listener(op);
    }
  }

  private applyOps(ops: NodeOperation[]) {
    for (const op of ops) {
      if (this.appliedOps.has(op.id.toString())) {
        continue;
      }

      if (isMoveNode(op)) {
        this.applyMove(op);
      } else if (isSetProperty(op)) {
        this.applyProperty(op);
      }
    }
  }

  private applyPendingMovesForParent(parentId: string) {
    if (!this.store.get(parentId)) {
      // Parent still doesn't exist, so we can't apply these moves yet
      return;
    }

    const pendingMoves = this.pendingMovesWithMissingParent.get(parentId) || [];
    this.pendingMovesWithMissingParent.delete(parentId);

    for (const pendingOp of pendingMoves) {
      this.applyMove(pendingOp);
    }
  }

  private tryToMove(op: MoveNode) {
    // If trying to move the target node under itself - do nothing
    if (op.targetId === op.parentId) return;

    // If the target node is an ancestor of the parent node (cycle) - do nothing
    if (op.parentId && this.isAncestor(op.parentId, op.targetId)) return;

    let targetNode = this.store.get(op.targetId);

    if (!targetNode) {
      // Create a new node
      targetNode = new TreeNode(op.targetId, op.parentId);

      // Apply pending properties for this node
      const pendingProperties = this.pendingPropertiesWithMissingNode.get(op.targetId) || [];
      for (const prop of pendingProperties) {
        targetNode.setProperty(prop.key, prop.value, prop.id);
      }
    } else {
      targetNode = targetNode.cloneWithNewParent(op.parentId);
    }

    this.store.set(op.targetId, targetNode);
  }

  private undoMove(op: MoveNode) {
    const targetNode = this.store.get(op.targetId);
    if (!targetNode) {
      //throw new Error(`targetNode ${op.targetId} not found`);
      return;
    }

    const nodeWithPrevParent = targetNode.cloneWithNewParent(op.prevParentId);
    this.store.set(op.targetId, nodeWithPrevParent);
  }

  /** Checks if the given `ancestorId` is an ancestor of `childId` in the tree */
  isAncestor(childId: string, ancestorId: string | null): boolean {
    let targetId = childId;
    let node: TreeNode | undefined;

    while ((node = this.store.get(targetId))) {
      if (node.parentId === ancestorId) return true;
      if (node.parentId === null || node.parentId === undefined) return false;

      targetId = node.parentId;
    }

    return false;
  }

  private applyProperty(op: SetNodeProperty) {
    const targetNode = this.store.get(op.targetId);
    if (!targetNode) {
      if (!this.pendingPropertiesWithMissingNode.has(op.targetId)) {
        this.pendingPropertiesWithMissingNode.set(op.targetId, []);
      }
      this.pendingPropertiesWithMissingNode.get(op.targetId)!.push(op);
      return;
    }

    this.updateLamportClock(op);

    const prevProp = targetNode.getProperty(op.key);

    // Apply the property if it's not already applied or if the current op is newer
    if (!prevProp || op.id.isGreaterThan(prevProp.prevOpId)) {
      this.store.setProperty(op.targetId, op.key, op.value, op.id);
      this.reportOpAsApplied(op);
    }
  }

  subscribe(nodeId: string | null, listener: (event: NodeChangeEvent) => void) {
    this.store.addChangeListener(nodeId, listener);
  }

  unsubscribe(nodeId: string | null, listener: (event: NodeChangeEvent) => void) {
    this.store.removeChangeListener(nodeId, listener);
  }

  subscribeToOpApplied(listener: (op: NodeOperation) => void) {
    this.opAppliedListeners.push(listener);
  }

  unsubscribeFromOpApplied(listener: (op: NodeOperation) => void) {
    this.opAppliedListeners = this.opAppliedListeners.filter(l => l !== listener);
  }
}