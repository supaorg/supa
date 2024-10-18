import { ReplicatedTree } from "./ReplicatedTree";

/**
 * TreeBranch is an abstraction over 'ReplicatedTree' that allows to reference a branch of a tree by its root node id.
 */
export class TreeBranch {
  private tree: ReplicatedTree;
  readonly rootVertexId: string;

  constructor(tree: ReplicatedTree, rootVertexId: string) {
    this.tree = tree;
    this.rootVertexId = rootVertexId;
  }

  getBranchFromTree(vertexId: string): TreeBranch {
    return new TreeBranch(this.tree, vertexId);
  }

  newBranch(): TreeBranch {
    const vertexId = this.tree.newVertex(this.rootVertexId);
    return new TreeBranch(this.tree, vertexId);
  }
}