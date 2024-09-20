// # Replicated Tree with Properties

class ReplicatedTreeWithProps {
  readonly rootId = "root";
  
  // https://en.wikipedia.org/wiki/Lamport_timestamp
  private lamportClock = 0;

  private nodes: Map<string, TreeNodeWithProps>;

  constructor() {
    this.nodes = new Map();
  }

}

class TreeNodeWithProps {
  private id: string;
  private parentId: string | null;

  constructor(id: string, parentId: string | null) {
    this.id = id;
    this.parentId = parentId;
  }
}

/* Notes
ReplicatedTree can run both on the client and the server. 
When running locally, the client will deal with saving ops and syncing
with peers. Otherwise, the server will deal with it.

On the client, UI will subscribe to ReplicatedTree and ask it to add/remove/update nodes.
*/