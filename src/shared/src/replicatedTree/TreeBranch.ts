import { ReplicatedTree } from "./ReplicatedTree";

/**
 * TreeBranch is an abstraction over 'ReplicatedTree' that allows to reference a branch of a tree by its root node id.
 */
export class TreeBranch {
  private tree: ReplicatedTree;
  readonly rootNodeId: string;

  constructor(tree: ReplicatedTree, rootNodeId: string) {
    this.tree = tree;
    this.rootNodeId = rootNodeId;
  }

  getBranch(nodeId: string): TreeBranch {
    return new TreeBranch(this.tree, nodeId);
  }

  newBranch(): TreeBranch {
    const nodeId = this.tree.newNode();
    return new TreeBranch(this.tree, nodeId);
  }
}