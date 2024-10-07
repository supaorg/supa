import { OpId } from "./OpId";
import { TreeNode, TreeNodeId, NodeChangeEvent, NodeMoveEvent, NodePropertyChangeEvent, NodeChildrenChangeEvent } from "./treeTypes";

export class SimpleTreeNodeStore {
  private nodes: Map<string, TreeNode>;
  private childrenCache: Map<TreeNodeId, string[]>;
  private changeListeners: Map<TreeNodeId, Set<(event: NodeChangeEvent) => void>> = new Map();
  private globalChangeListeners: Set<(event: NodeChangeEvent) => void> = new Set();

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
    const oldNode = this.nodes.get(nodeId);
    const prevParentId = oldNode?.parentId;
    const newParentId = node.parentId;

    this.nodes.set(nodeId, node);

    if (prevParentId !== newParentId) {
      this.notifyChange({
        type: 'move',
        nodeId,
        oldParentId: prevParentId,
        newParentId,
      } as NodeMoveEvent);

      // Update childrenCache
      if (newParentId !== undefined) {
        const newChildren = [...this.getChildrenIds(newParentId), nodeId];
        this.childrenCache.set(newParentId, newChildren);
        this.notifyChange({
          type: 'children',
          nodeId: newParentId,
          children: newChildren.map(id => this.nodes.get(id)!),
        } as NodeChildrenChangeEvent);
      }

      if (prevParentId !== undefined) {
        const newChildren = this.getChildrenIds(prevParentId).filter(id => id !== nodeId);
        this.childrenCache.set(prevParentId, newChildren);
        this.notifyChange({
          type: 'children',
          nodeId: prevParentId,
          children: newChildren.map(id => this.nodes.get(id)!),
        } as NodeChildrenChangeEvent);
      }
    }
  }

  setProperty(nodeId: string, key: string, value: any, opId: OpId) {
    const node = this.get(nodeId);
    if (node) {
      node.setProperty(key, value, opId);
    }

    this.notifyChange({
      type: 'property',
      nodeId,
      key,
      value,
      opId,
    } as NodePropertyChangeEvent);
  }

  addChangeListener(nodeId: TreeNodeId | null, listener: (event: NodeChangeEvent) => void) {
    if (nodeId === null) {
      this.globalChangeListeners.add(listener);
    } else {
      if (!this.changeListeners.has(nodeId)) {
        this.changeListeners.set(nodeId, new Set());
      }
      this.changeListeners.get(nodeId)!.add(listener);
    }
  }

  removeChangeListener(nodeId: TreeNodeId | null, listener: (event: NodeChangeEvent) => void) {
    if (nodeId === null) {
      this.globalChangeListeners.delete(listener);
    } else {
      this.changeListeners.get(nodeId)?.delete(listener);
    }
  }

  private notifyChange(event: NodeChangeEvent) {
    this.globalChangeListeners.forEach(listener => listener(event));
    this.changeListeners.get(event.nodeId)?.forEach(listener => listener(event));
  }

  printTree(nodeId: TreeNodeId = null, indent: string = "", isLast: boolean = true): string {
    const prefix = indent + (isLast ? "└── " : "├── ");
    let result = prefix + (nodeId === null ? "root" : nodeId) + "\n";

    let nodeName: string | null = null;

    if (nodeId !== null) {
      const node = this.get(nodeId);
      if (node) {
        for (const prop of node.getAllProperties()) {
          if (prop.key === "_n") {
            nodeName = prop.value as string;
            //continue;
          }

          const propPrefix = indent + (isLast ? "    " : "│   ") + "• ";
          result += `${propPrefix}${prop.key}: ${JSON.stringify(prop.value)}\n`;
        }
      }
    }

    const children = this.getChildrenIds(nodeId);
    for (let i = 0; i < children.length; i++) {
      const childId = children[i];
      const isLastChild = i === children.length - 1;
      result += this.printTree(childId, indent + (isLast ? "    " : "│   "), isLastChild);
    }

    return result;
  }
}