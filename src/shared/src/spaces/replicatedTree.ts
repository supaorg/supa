// # Replicated Tree with Properties - that is what Space is underneath 

/* Notes
ReplicatedTree can run both on the client and the server. 
When running locally, the client will deal with saving ops and syncing
with peers. Otherwise, the server will deal with it.

On the client, UI will subscribe to ReplicatedTree and ask it to add/remove/update nodes.
*/

import { v4 as uuidv4 } from "uuid";
import { moveNode, type MoveNode, setNodeProperty, isMoveNode, isSetProperty, type NodeOperation, type NodePropertyType } from "./operations";

export type TreeNodeType = {
  id: string;
  parentId: string | null;
}

export class TreeNode {
  readonly id: string;
  parentId: string | null;

  constructor(id: string, parentId: string | null) {
    this.id = id;
    this.parentId = parentId;
  }
}

class SimpleTreeNodeStore {
  private nodes: Map<string, TreeNode>;
  /**
   * Caching children ids (the source of truth is in the 'nodes')
   */
  private childrenCache: Map<string, string[]>;
  private changeListeners: Set<(oldNode: TreeNode | undefined, newNode: TreeNode) => void> = new Set();

  constructor() {
    this.nodes = new Map();
    this.childrenCache = new Map();
  }

  getRoot(): TreeNode | undefined {
    for (const node of this.nodes.values()) {
      if (node.parentId === null) {
        return node;
      }
    }

    return undefined;
  }

  get(nodeId: string): TreeNode | undefined {
    const node = this.nodes.get(nodeId);
    // Returning a copy so that the caller can't modify the node
    return node ? { ...node } : undefined;
  }

  getChildrenIds(nodeId: string): string[] {
    return this.childrenCache.get(nodeId) ?? [];
  }

  getChildren(nodeId: string): TreeNode[] {
    return this.getChildrenIds(nodeId)
      .map(id => {
        // Returning a copy so that the caller can't modify the node
        const node = this.nodes.get(id);
        return node ? { ...node } : undefined;
      })
      .filter(node => node !== undefined) as TreeNode[];
  }

  set(nodeId: string, node: TreeNode) {
    // Store the old parent ID before updating
    const oldNode = this.nodes.get(nodeId);
    const prevParentId = oldNode?.parentId;
    const parentId = node.parentId;

    this.nodes.set(nodeId, node);

    if (prevParentId === parentId) {
      this.notifyChange(oldNode, node);
      return;
    }

    // Here we update the cache of children ids. The source of truth is the nodes map.

    // Add to new parent
    if (parentId) {
      this.childrenCache.set(parentId, [...this.getChildrenIds(parentId), nodeId]);
    }

    // Remove from previous parent
    if (prevParentId) {
      this.childrenCache.set(prevParentId, this.getChildrenIds(prevParentId).filter(id => id !== nodeId));
    }

    this.notifyChange(oldNode, node);
  }

  addChangeListener(listener: (oldNode: TreeNode | undefined, newNode: TreeNode) => void) {
    this.changeListeners.add(listener);
  }

  removeChangeListener(listener: (oldNode: TreeNode | undefined, newNode: TreeNode) => void) {
    this.changeListeners.delete(listener);
  }

  private notifyChange(oldNode: TreeNode | undefined, newNode: TreeNode) {
    for (const listener of this.changeListeners) {
      listener(oldNode, newNode);
    }
  }

  printTree(nodeId: string, indent: string = "", isLast: boolean = true): string {
    const prefix = indent + (isLast ? "└── " : "├── ");
    let result = prefix + nodeId + "\n";

    const children = this.getChildrenIds(nodeId);
    for (let i = 0; i < children.length; i++) {
      const childId = children[i];
      const isLastChild = i === children.length - 1;
      result += this.printTree(childId, indent + (isLast ? "    " : "│   "), isLastChild);
    }

    return result;
  }
}

export class ReplicatedTree {
  readonly rootId: string;
  readonly peerId: string;

  private lamportClock = 0;
  private nodes: SimpleTreeNodeStore;
  private moveOps: MoveNode[] = [];
  private localMoveOps: MoveNode[] = [];
  private pendingMovesByParent: Map<string, MoveNode[]> = new Map();
  private appliedMoveOps: Set<string> = new Set();
  private changeListeners: Set<(oldNode: TreeNode | undefined, newNode: TreeNode) => void> = new Set();

  constructor(peerId: string, ops: MoveNode[] | null = null) {
    this.peerId = peerId;
    this.nodes = new SimpleTreeNodeStore();

    if (ops != null && ops.length > 0) {
      this.applyMoves(ops);

      const root = this.nodes.getRoot();

      if (!root) {
        throw new Error("Root node not found. We have to have a root node when starting with a set of operations");
      }

      this.rootId = root.id;
    } else {
      this.rootId = this.newIn();
    }

    this.nodes.addChangeListener(this.handleNodeChange);
  }

  getMoveOps(): MoveNode[] {
    return this.moveOps;
  }

  get(nodeId: string): TreeNode | undefined {
    return this.nodes.get(nodeId);
  }

  getParent(nodeId: string): TreeNode | undefined {
    const parentId = this.nodes.get(nodeId)?.parentId;
    return parentId ? this.nodes.get(parentId) : undefined;
  }

  getChildren(nodeId: string): TreeNode[] {
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

  popLocalMoveOps(): MoveNode[] {
    const ops = this.localMoveOps;
    this.localMoveOps = [];
    return ops;
  }

  newIn(parentId: string | null = null): string {
    const nodeId = uuidv4();

    // Yep, to create a node - we move a fresh node under the parent.
    // No need to have a separate "create node" operation.
    const op = moveNode(this.lamportClock++, this.peerId, nodeId, parentId, null);
    this.localMoveOps.push(op);
    this.applyMove(op);

    return nodeId;
  }

  move(nodeId: string, parentId: string | null) {
    const node = this.nodes.get(nodeId);
    const op = moveNode(this.lamportClock++, this.peerId, nodeId, parentId, node?.parentId ?? null);
    this.localMoveOps.push(op);
    this.applyMove(op);
  }

  setProperty(nodeId: string, key: string, value: NodePropertyType) {
    const op = setNodeProperty(this.lamportClock++, this.peerId, nodeId, key, value);
    // TODO: use property execution
  }

  printTree() {
    return this.nodes.printTree(this.rootId);
  }

  merge(ops: MoveNode[]) {
    // NOTE: should we keep a set of applied ops and not apply them again?

    this.applyMoves(ops);
  }

  public compareStructure(other: ReplicatedTree): boolean {
    return this.compareNodes(this.rootId, other.rootId, other);
  }

  private compareNodes(nodeId1: string, nodeId2: string, other: ReplicatedTree): boolean {
    const node1 = this.nodes.get(nodeId1);
    const node2 = other.nodes.get(nodeId2);

    if (!node1 || !node2) {
      return !node1 && !node2; // Both should be null or both should exist
    }

    if (node1.id !== node2.id) {
      return false;
    }

    const children1 = new Set(this.nodes.getChildrenIds(nodeId1));
    const children2 = new Set(other.nodes.getChildrenIds(nodeId2));

    if (children1.size !== children2.size) {
      return false;
    }

    for (const childId of children1) {
      if (!children2.has(childId)) {
        return false;
      }
      if (!this.compareNodes(childId, childId, other)) {
        return false;
      }
    }

    return true;
  }

  private applyMove(op: MoveNode) {
    if (op.parentId !== null && !this.nodes.get(op.parentId)) {
      // Parent doesn't exist yet, stash the move op for later
      if (!this.pendingMovesByParent.has(op.parentId)) {
        this.pendingMovesByParent.set(op.parentId, []);
      }
      this.pendingMovesByParent.get(op.parentId)!.push(op);
      return;
    }

    // This is how Lamport clock updates with a foreign operation that has a greater counter value.
    if (op.id.counter > this.lamportClock) {
      this.lamportClock = op.id.counter;
    }

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
      // We undo all recent moves (that are older than the new move), do the new move, and then redo the recent moves.
      // The algorithm ensures that all replicas converge to the same tree after applying all operations.
      // So if a conflict or a cycle is introduced by some of the peers - the algorithm will resolve it.
      // tryToMove function has the logic to detect cycles and will ignore the move if it's a cycle.
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

  private applyMoves(ops: MoveNode[]) {
    for (const op of ops) {
      if (this.appliedMoveOps.has(op.id.toString())) {
        continue;
      }

      this.applyMove(op);
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
    this.appliedMoveOps.add(op.id.toString());

    // If trying to move the target node under itself - do nothing
    if (op.targetId === op.parentId) return;

    // If the target node is an ancestor of the parent node (cycle) - do nothing
    if (op.parentId && this.isAncestor(op.parentId, op.targetId)) return;

    let targetNode = this.nodes.get(op.targetId);

    if (!targetNode) {
      targetNode = new TreeNode(op.targetId, op.parentId);
    }

    targetNode.parentId = op.parentId;

    this.nodes.set(op.targetId, targetNode);
  }

  private undoMove(op: MoveNode) {
    const targetNode = this.nodes.get(op.targetId);
    if (!targetNode) {
      //throw new Error(`targetNode ${op.targetId} not found`);
      return;
    }

    targetNode.parentId = op.prevParentId;
    this.nodes.set(op.targetId, targetNode);
  }

  /** Checks if the given `ancestorId` is an ancestor of `childId` in the tree */
  isAncestor(childId: string, ancestorId: string | null): boolean {
    let targetId = childId;
    let node: TreeNode | undefined;

    while ((node = this.nodes.get(targetId))) {
      if (node.parentId === ancestorId) return true;
      if (node.parentId === null) return false;

      targetId = node.parentId;
    }

    return false;
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

