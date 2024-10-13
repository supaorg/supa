import { TreeNodeId, NodeChangeEvent, NodeMoveEvent, NodePropertyChangeEvent, NodeChildrenChangeEvent } from "./treeTypes";
import { TreeNode } from "./TreeNode";

export class SimpleTreeNodeStore {
  private nodes: Map<TreeNodeId, TreeNode>;
  private changeListeners: Map<TreeNodeId, Set<(event: NodeChangeEvent) => void>> = new Map();
  private globalChangeListeners: Set<(event: NodeChangeEvent) => void> = new Set();

  constructor() {
    this.nodes = new Map();
    this.childrenCache = new Map();
  }

  getAllNodes(): ReadonlyArray<TreeNode> {
    return Array.from(this.nodes.values());
  }

  get(nodeId: string): TreeNode | undefined {
    return this.nodes.get(nodeId);
  }

  getChildrenIds(nodeId: TreeNodeId): string[] {
    return this.get(nodeId)?.children ?? [];
  }

  getChildren(nodeId: TreeNodeId): TreeNode[] {
    return this.getChildrenIds(nodeId)
      .map(id => {
        // Returning a copy so that the caller can't modify the node
        const node = this.nodes.get(id);
        return node ? node : undefined;
      })
      .filter(node => node !== undefined) as TreeNode[];
  }

  moveNode(nodeId: TreeNodeId, newParentId: TreeNodeId | null): TreeNode {
    let node = this.get(nodeId);
    const prevParentId = node ? node.parentId : undefined;
    if (!node) {
      node = new TreeNode(nodeId, newParentId);
      this.nodes.set(nodeId, node);
    }

    if (prevParentId === newParentId) {
      return node;
    }

    node.parentId = newParentId;

    let childrenInNewParent: string[] | null = null;
    let childrenInOldParent: string[] | null = null;

    // Update children arrays in nodes
    if (prevParentId) {
      const oldParentNode = this.get(prevParentId);
      if (oldParentNode) {
        oldParentNode.children = oldParentNode.children.filter(child => child !== nodeId);
        childrenInOldParent = oldParentNode.children;
      } else {
        console.error(`Old parent node not found for ${prevParentId}`);
      }
    }

    if (newParentId !== null) {
      const newParentNode = this.nodes.get(newParentId);
      if (newParentNode) {
        newParentNode.children.push(nodeId);
        childrenInNewParent = newParentNode.children;
      } else {
        console.error(`New parent node not found for ${newParentId}`);
      }
    }

    this.notifyChange({
      type: 'move',
      nodeId,
      oldParentId: prevParentId,
      newParentId,
    } as NodeMoveEvent);

    // We notify the listeners in the end so that they can get the full state of the tree

    if (childrenInNewParent !== null && newParentId !== null) {
      this.notifyChange({
        type: 'children',
        nodeId: newParentId,
        children: childrenInNewParent.map(id => this.nodes.get(id)!),
      } as NodeChildrenChangeEvent);
    }

    if (childrenInOldParent !== null && prevParentId !== null) {
      this.notifyChange({
        type: 'children',
        nodeId: prevParentId,
        children: childrenInOldParent.map(id => this.nodes.get(id)!),
      } as NodeChildrenChangeEvent);
    }

    return node;
  }

  setProperty(nodeId: string, key: string, value: any) {
    const node = this.get(nodeId);
    if (node) {
      node.setProperty(key, value);
    }

    this.notifyChange({
      type: 'property',
      nodeId,
      key,
      value,
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

  printTree(nodeId: TreeNodeId, indent: string = "", isLast: boolean = true): string {
    const prefix = indent + (isLast ? "└── " : "├── ");
    let result = prefix + nodeId + "\n";

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