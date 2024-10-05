import { TreeNode, type TreeNodeId } from "./spaceTypes";

export class SimpleTreeNodeStore {
  private nodes: Map<string, TreeNode>;
  /**
   * Caching children ids (the source of truth is in the 'nodes')
   */
  private childrenCache: Map<TreeNodeId, string[]>;
  private changeListeners: Set<(oldNode: TreeNode | undefined, newNode: TreeNode) => void> = new Set();

  constructor() {
    this.nodes = new Map();
    this.childrenCache = new Map();
  }

  get(nodeId: string): TreeNode | undefined {
    return this.nodes.get(nodeId);
  }

  getChildrenIds(nodeId: TreeNodeId): string[] {
    return this.childrenCache.get(nodeId) ?? [];
  }

  getChildren(nodeId: TreeNodeId): TreeNode[] {
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
    // When we create a new node, oldNode is undefined, 
    // therefore prevParentId is undefined (not null, because we reseve null for the root of the tree)
    const prevParentId = oldNode === undefined ? undefined : oldNode.parentId;
    const parentId = node.parentId;

    this.nodes.set(nodeId, node);

    // Nothing has changed.
    if (prevParentId === parentId) {
      this.notifyChange(oldNode, node);
      return;
    }

    // Here we update the cache of children ids. The source of truth is the nodes map.

    // Add to new parent
    this.childrenCache.set(parentId, [...this.getChildrenIds(parentId), nodeId]);

    // Remove from previous parent
    if (prevParentId !== parentId && prevParentId !== undefined) {
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

  printTree(nodeId: TreeNodeId = null, indent: string = "", isLast: boolean = true): string {
    const prefix = indent + (isLast ? "└── " : "├── ");
    let result = prefix + (nodeId === null ? "root" : nodeId) + "\n";

    const children = this.getChildrenIds(nodeId);
    for (let i = 0; i < children.length; i++) {
      const childId = children[i];
      const isLastChild = i === children.length - 1;
      result += this.printTree(childId, indent + (isLast ? "    " : "│   "), isLastChild);
    }

    return result;
  }
}