// # Replicated Tree with Properties - that is what Space is underneath 

/* Notes
ReplicatedTree can run both on the client and the server. 
When running locally, the client will deal with saving ops and syncing
with peers. Otherwise, the server will deal with it.

On the client, UI will subscribe to ReplicatedTree and ask it to add/remove/update nodes.
*/

import { v4 as uuidv4 } from "uuid";
import { moveNode, type MoveNode, type SetNodeProperty, isMoveNode, isSetProperty, type NodeOperation, setNodeProperty } from "./operations";
import { NodePropertyType, TreeNode, TreeNodeProperty } from "./spaceTypes";
import { SimpleTreeNodeStore } from "./SimpleTreeNodeStore";

export class ReplicatedTree {
  readonly peerId: string;

  private lamportClock = 0;
  private nodes: SimpleTreeNodeStore;
  private moveOps: MoveNode[] = [];
  private localOps: NodeOperation[] = [];
  private pendingMovesByParent: Map<string, MoveNode[]> = new Map();
  private pendingPropertiesByNode: Map<string, SetNodeProperty[]> = new Map();
  private appliedOps: Set<string> = new Set();
  private changeListeners: Set<(oldNode: TreeNode | undefined, newNode: TreeNode) => void> = new Set();

  constructor(peerId: string, ops: NodeOperation[] | null = null) {
    this.peerId = peerId;
    this.nodes = new SimpleTreeNodeStore();

    if (ops != null && ops.length > 0) {
      this.applyOps(ops);
    }

    this.nodes.addChangeListener(this.handleNodeChange);
  }

  getMoveOps(): MoveNode[] {
    return this.moveOps;
  }

  getNode(nodeId: string): TreeNode | undefined {
    return this.nodes.get(nodeId);
  }

  getParent(nodeId: string): TreeNode | undefined {
    const parentId = this.nodes.get(nodeId)?.parentId;
    return parentId ? this.nodes.get(parentId) : undefined;
  }

  getChildren(nodeId: string | null): TreeNode[] {
    return this.nodes.getChildren(nodeId);
  }

  getAncestors(nodeId: string): TreeNode[] {
    const ancestors: TreeNode[] = [];
    let currentNode = this.nodes.get(nodeId);

    while (currentNode && currentNode.parentId) {
      const parentNode = this.nodes.get(currentNode.parentId);
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
    const node = this.nodes.get(nodeId);
    
    if (!node) {
      return undefined;
    }

    return node.getProperty(key);
  }

  getNodeProperties(nodeId: string): Readonly<TreeNodeProperty[]> {
    const node = this.nodes.get(nodeId);
    
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
    const node = this.nodes.get(nodeId);
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

  printTree() {
    return this.nodes.printTree(null);
  }

  merge(ops: NodeOperation[]) {
    this.applyOps(ops);
  }

  compareStructure(other: ReplicatedTree): boolean {
    return ReplicatedTree.compareNodes(null, this, other);
  }

  static compareNodes(nodeId: string | null, treeA: ReplicatedTree, treeB: ReplicatedTree): boolean {
    const childrenA = treeA.nodes.getChildrenIds(nodeId);
    const childrenB = treeB.nodes.getChildrenIds(nodeId);

    if (childrenA.length !== childrenB.length) {
      return false;
    }

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
    if (op.parentId !== null && !this.nodes.get(op.parentId)) {
      // Parent doesn't exist yet, stash the move op for later
      if (!this.pendingMovesByParent.has(op.parentId)) {
        this.pendingMovesByParent.set(op.parentId, []);
      }
      this.pendingMovesByParent.get(op.parentId)!.push(op);
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
    if (!this.nodes.get(parentId)) {
      // Parent still doesn't exist, so we can't apply these moves yet
      return;
    }

    const pendingMoves = this.pendingMovesByParent.get(parentId) || [];
    this.pendingMovesByParent.delete(parentId);

    for (const pendingOp of pendingMoves) {
      this.applyMove(pendingOp);
    }
  }

  private tryToMove(op: MoveNode) {
    this.appliedOps.add(op.id.toString());

    // If trying to move the target node under itself - do nothing
    if (op.targetId === op.parentId) return;

    // If the target node is an ancestor of the parent node (cycle) - do nothing
    if (op.parentId && this.isAncestor(op.parentId, op.targetId)) return;

    let targetNode = this.nodes.get(op.targetId);

    if (!targetNode) {
      // Create a new node
      targetNode = new TreeNode(op.targetId, op.parentId);

      // Apply pending properties for this node
      const pendingProperties = this.pendingPropertiesByNode.get(op.targetId) || [];
      for (const prop of pendingProperties) {
        targetNode.setProperty(prop.key, prop.value, prop.id);
      }
    } else {
      targetNode = targetNode.cloneWithNewParent(op.parentId);
    }

    this.nodes.set(op.targetId, targetNode);
  }

  private undoMove(op: MoveNode) {
    const targetNode = this.nodes.get(op.targetId);
    if (!targetNode) {
      //throw new Error(`targetNode ${op.targetId} not found`);
      return;
    }

    const nodeWithPrevParent = targetNode.cloneWithNewParent(op.prevParentId);
    this.nodes.set(op.targetId, nodeWithPrevParent);
  }

  /** Checks if the given `ancestorId` is an ancestor of `childId` in the tree */
  isAncestor(childId: string, ancestorId: string | null): boolean {
    let targetId = childId;
    let node: TreeNode | undefined;

    while ((node = this.nodes.get(targetId))) {
      if (node.parentId === ancestorId) return true;
      if (node.parentId === null || node.parentId === undefined) return false;

      targetId = node.parentId;
    }

    return false;
  }

  private applyProperty(op: SetNodeProperty) {
    const targetNode = this.nodes.get(op.targetId);
    // If the node doesn't exist yet - put the operation into the pending set.
    if (!targetNode) {
      if (!this.pendingPropertiesByNode.has(op.targetId)) {
        this.pendingPropertiesByNode.set(op.targetId, []);
      }
      this.pendingPropertiesByNode.get(op.targetId)!.push(op);
      return;
    }

    this.updateLamportClock(op);

    const prevProp = targetNode.getProperty(op.key);
    if (prevProp) {
      // Here's is the core of the map CRDT algorithm.
      // As simple as that - we only apply the operation if it's newer than the previous operation on this node.
      if (op.id.isGreaterThan(prevProp.prevOpId)) {
        targetNode.setProperty(op.key, op.value, op.id);
      }
    } else {
      targetNode.setProperty(op.key, op.value, op.id);
    }
  }

  private handleNodeChange = (oldNode: TreeNode | undefined, newNode: TreeNode) => {
    for (const listener of this.changeListeners) {
      listener(oldNode, newNode);
    }
  }

  subscribe(listener: (oldNode: TreeNode | undefined, newNode: TreeNode) => void) {
    this.changeListeners.add(listener);
  }

  unsubscribe(listener: (oldNode: TreeNode | undefined, newNode: TreeNode) => void) {
    this.changeListeners.delete(listener);
  }
}