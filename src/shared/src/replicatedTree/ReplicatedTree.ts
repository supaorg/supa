import { v4 as uuidv4 } from "uuid";
import { moveNode, type MoveNode, type SetNodeProperty, isMoveNode, isSetProperty, type NodeOperation, setNodeProperty } from "./operations";
import { NodePropertyType, TreeNode, TreeNodeProperty, NodeChangeEvent } from "./treeTypes";
import { SimpleTreeNodeStore } from "./SimpleTreeNodeStore";
import { OpId } from "./OpId";

/**
 * ReplicatedTree is a tree data structure for storing nodes with properties.
 * It uses CRDTs to manage seamless replication between peers.
 */
export class ReplicatedTree {
  readonly peerId: string;
  readonly rootNodeId: string;

  private lamportClock = 0;
  private store: SimpleTreeNodeStore;
  private moveOps: MoveNode[] = [];
  private localOps: NodeOperation[] = [];
  private pendingMovesWithMissingParent: Map<string, MoveNode[]> = new Map();
  private pendingPropertiesWithMissingNode: Map<string, SetNodeProperty[]> = new Map();
  private appliedOps: Set<string> = new Set();
  private parentIdBeforeMove: Map<OpId, string | null | undefined> = new Map();
  private opAppliedListeners: ((op: NodeOperation) => void)[] = [];

  constructor(peerId: string, ops: ReadonlyArray<NodeOperation> | null = null) {
    this.peerId = peerId;
    this.store = new SimpleTreeNodeStore();

    if (ops != null && ops.length > 0) {
      // Find a move op that has a parentId as null
      let rootMoveOp;
      for (let i = 0; i < ops.length; i++) {
        if (isMoveNode(ops[i]) && (ops[i] as MoveNode).parentId === null) {
          rootMoveOp = ops[i];
          break;
        }
      }
      if (rootMoveOp) {
        this.rootNodeId = rootMoveOp.targetId;
      } else {
        throw new Error('The operations has to contain a move operation with a parentId as null to set the root node');
      }

      this.applyOps(ops);
    } else {
      // The root is our only node that will have a null parentId
      this.rootNodeId = this.newNodeInternal(null);
    }
  }

  getMoveOps(): ReadonlyArray<MoveNode> {
    return this.moveOps;
  }

  getNode(nodeId: string): TreeNode | undefined {
    return this.store.get(nodeId);
  }

  getAllNodes(): ReadonlyArray<TreeNode> {
    return this.store.getAllNodes();
  }

  getParent(nodeId: string): TreeNode | undefined {
    const parentId = this.store.get(nodeId)?.parentId;
    return parentId ? this.store.get(parentId) : undefined;
  }

  getChildren(nodeId: string): TreeNode[] {
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

  private newNodeInternal(parentId: string | null): string {
    const nodeId = uuidv4();
    this.lamportClock++;
    // To create a node - we move a node with a fresh id under the parent.
    // No need to have a separate "create node" operation.
    const op = moveNode(this.lamportClock, this.peerId, nodeId, parentId);
    this.localOps.push(op);
    this.applyMove(op);

    return nodeId;
  }

  newNode(parentId: string): string {
    return this.newNodeInternal(parentId);
  }

  move(nodeId: string, parentId: string) {
    this.lamportClock++;
    const op = moveNode(this.lamportClock, this.peerId, nodeId, parentId);
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

    const rootNode = this.store.get(this.rootNodeId);
    if (!rootNode) {
      throw new Error('The root node is not found');
    }

    // First check the root node's property '_n'
    if (rootNode.getProperty('_n')?.value === pathParts[0]) {
      return this.getNodeByPathArray(rootNode, pathParts.slice(1));
    }

    return undefined;
  }

  getNodeByPathArray(currentNode: TreeNode, path: string[]): TreeNode | undefined {
    if (path.length === 0) {
      return currentNode ?? undefined;
    }

    const firstName = path[0];
    const rest = path.slice(1);

    // Now, search recursively by name '_n' in children until the path is empty or not found.
    const children = this.getChildren(currentNode.id);
    for (const child of children) {
      if (child.getProperty('_n')?.value === firstName) {
        return this.getNodeByPathArray(child, rest);
      }
    }

    return undefined;
  }

  printTree() {
    return this.store.printTree(this.rootNodeId);
  }

  merge(ops: ReadonlyArray<NodeOperation>) {
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
    return ReplicatedTree.compareNodes(this.rootNodeId, this, other);
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

  static compareNodes(nodeId: string, treeA: ReplicatedTree, treeB: ReplicatedTree): boolean {
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

  /** Updates the lamport clock with the counter value of the operation */
  private updateLamportClock(operation: NodeOperation): void {
    // This is how Lamport clock updates with a foreign operation that has a greater counter value.
    if (operation.id.counter > this.lamportClock) {
      this.lamportClock = operation.id.counter;
    }
  }

  private applyMove(op: MoveNode) {
    // Check if a parent (unless we're dealing with the root node) exists for the move operation.
    // If it doesn't exist, stash the move op for later
    if (op.parentId !== null && !this.store.get(op.parentId)) {
      if (!this.pendingMovesWithMissingParent.has(op.parentId)) {
        this.pendingMovesWithMissingParent.set(op.parentId, []);
      }
      this.pendingMovesWithMissingParent.get(op.parentId)!.push(op);
      return;
    }

    this.updateLamportClock(op);

    const lastOp = this.moveOps.length > 0 ? this.moveOps[this.moveOps.length - 1] : null;

    if (lastOp === null || op.id.isGreaterThan(lastOp.id)) {
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
    // We use targetId here because this node might now be a parent for pending operations
    this.applyPendingMovesForParent(op.targetId);
  }

  private reportOpAsApplied(op: NodeOperation) {
    this.appliedOps.add(op.id.toString());
    for (const listener of this.opAppliedListeners) {
      listener(op);
    }
  }

  private applyOps(ops: ReadonlyArray<NodeOperation>) {
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

  /** Applies operations in an optimized way, sorting move ops by OpId to avoid undo-do-redo cycles */
  private applyOpsOptimizedForLotsOfMoves(ops: ReadonlyArray<NodeOperation>) {
    const newMoveOps = ops.filter(op => isMoveNode(op) && !this.appliedOps.has(op.id.toString()));
    if (newMoveOps.length > 0) {
      // Clear the nodes

      // Get an array of all move ops (without already applied ones)
      const allMoveOps = [...this.moveOps, ...newMoveOps] as MoveNode[];
      // Important to sort them by OpId, so there's no undo-do-redo cycles (the conflict resolution algorithm)
      allMoveOps.sort((a, b) => OpId.compare(a.id, b.id));
      for (let i = 0, len = allMoveOps.length; i < len; i++) {
        const op = allMoveOps[i];
        this.applyMove(op);
      }
    }

    // Get an array of all property ops (without already applied ones)
    const propertyOps = ops.filter(op => isSetProperty(op) && !this.appliedOps.has(op.id.toString())) as SetNodeProperty[];
    for (let i = 0, len = propertyOps.length; i < len; i++) {
      const op = propertyOps[i];
      this.applyProperty(op);
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
    let targetNode = this.store.get(op.targetId);

    if (targetNode) {
      this.parentIdBeforeMove.set(op.id, targetNode.parentId);
    }

    // If trying to move the target node under itself - do nothing
    if (op.targetId === op.parentId) return;

    // If we try to move the node (op.targetId) under one of its descendants (op.parentId) - do nothing
    if (op.parentId && this.isAncestor(op.parentId, op.targetId)) return;

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
      // @TODO: should I be worried if this ever happens?
      //throw new Error(`targetNode ${op.targetId} not found`);
      console.error(`targetNode ${op.targetId} not found`);
      return;
    }

    const prevParentId = this.parentIdBeforeMove.get(op.id);
    if (prevParentId === undefined) {
      // @TODO: delete the node?
      return;
    }

    const nodeWithPrevParent = targetNode.cloneWithNewParent(prevParentId);
    this.store.set(op.targetId, nodeWithPrevParent);
  }

  /** Checks if the given `ancestorId` is an ancestor of `childId` in the tree */
  isAncestor(childId: string, ancestorId: string | null): boolean {
    let targetId = childId;
    let node: TreeNode | undefined;

    const maxDepth = 1000;
    let depth = 0;

    while ((node = this.store.get(targetId))) {
      if (node.parentId === ancestorId) return true;
      if (!node.parentId) return false;

      if (depth > maxDepth) {
        console.error(`isAncestor: max depth of ${maxDepth} reached. Perhaps, we have an infinite loop here.`);
        return true;
      }

      targetId = node.parentId;
      depth++;
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
    // This is the last writer wins approach that ensures the same state between replicas.
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