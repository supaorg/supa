// # Replicated Tree with Properties - that is what Space is underneath 

/* Notes
ReplicatedTree can run both on the client and the server. 
When running locally, the client will deal with saving ops and syncing
with peers. Otherwise, the server will deal with it.

On the client, UI will subscribe to ReplicatedTree and ask it to add/remove/update nodes.
*/

import { OpId } from "./opId";
import { v4 as uuidv4 } from "uuid";
import { moveNode, setNodeProperty, isMoveNode, isSetProperty, type NodeOperation } from "./operations";

export type NodePropertyType = string | number | boolean | string[] | number[] | boolean[];

class NodeWithProps {
  readonly id: string;
  parentId: string | null;
  childrenIds: string[];
  props: Map<string, {
    value: NodePropertyType;
    prevOpId: OpId;
  }>;

  constructor(id: string, parentId: string | null) {
    this.id = id;
    this.parentId = parentId;
    this.props = new Map();
    this.childrenIds = [];
  }
}

export class ReplicatedTree {
  readonly rootId: string;
  readonly peerId: string;

  // https://en.wikipedia.org/wiki/Lamport_timestamp
  private lamportClock = 0;

  private nodes: Map<string, NodeWithProps>;

  constructor(peerId: string) {
    this.rootId = uuidv4();
    this.peerId = peerId;
    this.nodes = new Map();
    this.nodes.set(this.rootId, new NodeWithProps(this.rootId, null));
  }

  get(nodeId: string): NodeWithProps | undefined {
    return this.nodes.get(nodeId);
  }

  getParent(nodeId: string): NodeWithProps | undefined {
    const parentId = this.nodes.get(nodeId)?.parentId;
    return parentId ? this.nodes.get(parentId) : undefined;
  }

  getChildren(nodeId: string): NodeWithProps[] {
    const childrenIds = this.nodes.get(nodeId)?.childrenIds ?? [];
    return childrenIds.map(id => this.nodes.get(id)).filter(node => node !== undefined);
  }

  new(parentId: string) {
    const nodeId = uuidv4();
    // Yep, to create a node - we move a fresh node under the parent.
    // No need to have a separate "create node" operation.
    const op = moveNode(new OpId(this.lamportClock++, this.peerId), nodeId, parentId);
    this.applyOperation(op);
  }

  move(nodeId: string, parentId: string | null) {
    const op = moveNode(new OpId(this.lamportClock++, this.peerId), nodeId, parentId);
    this.applyOperation(op);
  }

  setProperty(nodeId: string, key: string, value: NodePropertyType) {
    const op = setNodeProperty(new OpId(this.lamportClock++, this.peerId), nodeId, key, value);
    this.applyOperation(op);
  }

  applyOperation(op: NodeOperation) {
    if (isMoveNode(op)) {
      const node = this.nodes.get(op.targetId);
      if (!node) {
        // new node
        this.nodes.set(op.targetId, new NodeWithProps(op.targetId, op.parentId));
      } else {
        node.parentId = op.parentId;
      }
    } else if (isSetProperty(op)) {
      const node = this.nodes.get(op.targetId);
      if (!node) {
        // stash the operation for when the node is created
        return;
      }
      node.props.set(op.key, { value: op.value, prevOpId: op.id });
    }
  }

}

