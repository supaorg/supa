// # Replicated Tree with Properties - that is what Space is underneath 

/* Notes
ReplicatedTree can run both on the client and the server. 
When running locally, the client will deal with saving ops and syncing
with peers. Otherwise, the server will deal with it.

On the client, UI will subscribe to ReplicatedTree and ask it to add/remove/update nodes.
*/

import { OpId } from "./OpId";
import { v4 as uuidv4 } from "uuid";
import { moveNode, type MoveNode, setNodeProperty, isMoveNode, isSetProperty, type NodeOperation, type NodePropertyType } from "./operations";

export type TreeNodeType = {
  id: string;
  parentId: string | null;
}

class TreeNode {
  readonly id: string;
  parentId: string | null;
  /*
  childrenIds: string[];
  props: Map<string, {
    value: NodePropertyType;
    // We store the previous opId to resolve conflicts when multiple clients try to update the same node.
    // Writer with the latest OpId wins.
    prevOpId: OpId;
  }>;
  */

  constructor(id: string, parentId: string | null) {
    this.id = id;
    this.parentId = parentId;
  }
}

class SimpleTreeNodeStore {
  private nodes: Map<string, TreeNode>;
  private children: Map<string, string[]>;

  constructor() {
    this.nodes = new Map();
    this.children = new Map();
  }

  get(nodeId: string): TreeNode | undefined {
    const node = this.nodes.get(nodeId);
    // Returning a copy so that the caller can't modify the node
    return node ? { ...node } : undefined;
  }

  getChildrenIds(nodeId: string): string[] {
    return this.children.get(nodeId) ?? [];
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
    const oldParentId = this.nodes.get(nodeId)?.parentId;

    this.nodes.set(nodeId, node);

    // Add to new parent
    const parentId = node.parentId;
    if (parentId) {
      this.children.set(parentId, [...this.getChildrenIds(parentId), nodeId]);
    }

    // Remove from previous parent
    if (oldParentId) {
      this.children.set(oldParentId, this.getChildrenIds(oldParentId).filter(id => id !== nodeId));
    }
  }

  /*
  printTree(nodeId: string = this.nodes.keys().next().value, indent: string = ""): void {
    const node = this.get(nodeId);
    if (!node) return;

    console.log(`${indent}${node.id}`);
    const children = this.getChildrenIds(nodeId);
    for (const childId of children) {
      this.printTree(childId, indent + "  ");
    }
  }
  */

  printTree(nodeId: string = this.nodes.keys().next().value, indent: string = "", isLast: boolean = true): string {
    const node = this.get(nodeId);
    if (!node) return "";

    const prefix = indent + (isLast ? "└── " : "├── ");
    let result = prefix + node.id + "\n";

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

  // https://en.wikipedia.org/wiki/Lamport_timestamp
  private lamportClock = 0;
  private nodes: SimpleTreeNodeStore;
  private moveOps: MoveNode[];

  constructor(peerId: string) {
    this.rootId = uuidv4();
    this.peerId = peerId;
    this.nodes = new SimpleTreeNodeStore();
    this.moveOps = [];

    const rootNodeOp = moveNode(this.lamportClock++, this.peerId, this.rootId, null, null);
    this.applyMove(rootNodeOp);
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

  new(parentId: string): string {
    const nodeId = uuidv4();
    // Yep, to create a node - we move a fresh node under the parent.
    // No need to have a separate "create node" operation.
    const op = moveNode(this.lamportClock++, this.peerId, nodeId, parentId, null);
    this.applyMove(op);

    return nodeId;
  }

  move(nodeId: string, parentId: string | null) {
    const node = this.nodes.get(nodeId);
    const op = moveNode(this.lamportClock++, this.peerId, nodeId, parentId, node?.parentId ?? null);
    this.applyMove(op);
  }

  setProperty(nodeId: string, key: string, value: NodePropertyType) {
    const op = setNodeProperty(this.lamportClock++, this.peerId, nodeId, key, value);
    // TODO: use property execution
  }

  applyMove(op: MoveNode) {
    if (this.moveOps.length === 0) {
      this.moveOps.push(op);
      this.tryToMove(op);
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

      for (let i = 0; i < this.moveOps.length; i++) {
        const moveOp = this.moveOps[i];
        if (op.id.isGreaterThan(moveOp.id)) {
          // Insert the op at the current position
          this.moveOps.splice(i, 0, op);
          this.tryToMove(op);
          break;
        } else {
          this.undoMove(moveOp);
          opsToRedo.push(moveOp);
        }
      }

      for (const moveOp of opsToRedo) {
        this.tryToMove(moveOp);
      }
    }
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

  tryToMove(op: MoveNode) {
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

  undoMove(op: MoveNode) {
    const targetNode = this.nodes.get(op.targetId);
    if (!targetNode) {
      throw new Error(`targetNode ${op.targetId} not found`);
    }

    targetNode.parentId = op.prevParentId;
  }

  printTree() {
    return this.nodes.printTree(this.rootId);
  }
}

