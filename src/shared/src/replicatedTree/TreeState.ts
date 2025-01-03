import type { TreeVertexId, VertexChangeEvent, VertexPropertyChangeEvent, VertexChildrenChangeEvent, VertexMoveEvent } from "./treeTypes";
import { VertexState } from "./VertexState";

export class TreeState {
  private vertices: Map<TreeVertexId, VertexState>;
  private changeCallbacks: Map<TreeVertexId, Set<(events: VertexChangeEvent[]) => void>> = new Map();
  private globalChangeCallbacks: Set<(events: VertexChangeEvent[]) => void> = new Set();

  private batchTickInterval: number;
  private batchedEvents: Map<TreeVertexId, VertexChangeEvent[]> = new Map();

  constructor() {
    this.vertices = new Map();

    this.batchTickInterval = setInterval(() => {
      this.processBatchedEvents();
    }, 33.3);
  }

  dispose() {
    clearInterval(this.batchTickInterval);
  }

  private processBatchedEvents() {
    for (const [vertexId, events] of this.batchedEvents) {
      // Get last property events per key and last move/children events
      let lastMoveEvent: VertexMoveEvent | null = null;
      let lastChildrenEvent: VertexChildrenChangeEvent | null = null;
      const propertyEventsByKey = new Map<string, VertexPropertyChangeEvent>();

      for (let i = events.length - 1; i >= 0; i--) {
        const event = events[i];
        if (!lastMoveEvent && event.type === 'move') lastMoveEvent = event as VertexMoveEvent;
        if (!lastChildrenEvent && event.type === 'children') lastChildrenEvent = event as VertexChildrenChangeEvent;
        if (event.type === 'property') {
          const propertyEvent = event as VertexPropertyChangeEvent;
          if (!propertyEventsByKey.has(propertyEvent.key)) {
            propertyEventsByKey.set(propertyEvent.key, propertyEvent);
          }
        }
      }

      // Combine all events with move and children events first
      const filteredEvents = [
        ...(lastMoveEvent ? [lastMoveEvent] : []),
        ...(lastChildrenEvent ? [lastChildrenEvent] : []),
        ...propertyEventsByKey.values()
      ];

      this.globalChangeCallbacks.forEach(listener => listener(filteredEvents));
      this.changeCallbacks.get(vertexId)?.forEach(listener => listener(filteredEvents));
    }

    this.batchedEvents.clear();
  }

  getAllVertices(): ReadonlyArray<VertexState> {
    return Array.from(this.vertices.values());
  }

  getVertex(id: string): VertexState | undefined {
    return this.vertices.get(id);
  }

  getChildrenIds(vertexId: TreeVertexId): string[] {
    return this.getVertex(vertexId)?.children ?? [];
  }

  getChildren(vertexId: TreeVertexId): VertexState[] {
    return this.getChildrenIds(vertexId)
      .map(id => {
        // Returning a copy so that the caller can't modify the vertex
        const vertex = this.vertices.get(id);
        return vertex ? vertex : undefined;
      })
      .filter(vertex => vertex !== undefined) as VertexState[];
  }

  moveVertex(vertexId: TreeVertexId, newParentId: TreeVertexId | null): VertexState {
    let vertex = this.getVertex(vertexId);
    const prevParentId = vertex ? vertex.parentId : undefined;
    if (!vertex) {
      vertex = new VertexState(vertexId, newParentId);
      this.vertices.set(vertexId, vertex);
    }

    if (prevParentId === newParentId) {
      return vertex;
    }

    vertex.parentId = newParentId;

    let childrenInNewParent: string[] | null = null;
    let childrenInOldParent: string[] | null = null;

    // Update children arrays in vertices
    if (prevParentId) {
      const oldParentVertex = this.getVertex(prevParentId);
      if (oldParentVertex) {
        oldParentVertex.children = oldParentVertex.children.filter(child => child !== vertexId);
        childrenInOldParent = oldParentVertex.children;
      } else {
        console.error(`Old parent vertex not found for ${prevParentId}`);
      }
    }

    if (newParentId !== null) {
      const newParentVertex = this.vertices.get(newParentId);
      if (newParentVertex) {
        newParentVertex.children.push(vertexId);
        childrenInNewParent = newParentVertex.children;
      } else {
        console.error(`New parent vertex not found for ${newParentId}`);
      }
    }

    // We notify the listeners in the end so that they have the final state of the tree

    this.notifyChange({
      type: 'move',
      vertexId: vertexId,
      // @TODO: how do I detect that the vertex that was moved is new? oldParentId is null or undefined?
      oldParentId: prevParentId,
      newParentId,
    } as VertexMoveEvent);

    if (childrenInNewParent !== null && newParentId !== null) {
      this.notifyChange({
        type: 'children',
        vertexId: newParentId,
        children: childrenInNewParent.map(id => this.vertices.get(id)!),
      } as VertexChildrenChangeEvent);
    }

    if (childrenInOldParent !== null && prevParentId !== null) {
      this.notifyChange({
        type: 'children',
        vertexId: prevParentId,
        children: childrenInOldParent.map(id => this.vertices.get(id)!),
      } as VertexChildrenChangeEvent);
    }

    return vertex;
  }

  setProperty(vertexId: string, key: string, value: any) {
    const vertex = this.getVertex(vertexId);
    if (!vertex) {
      throw new Error(`Vertex ${vertexId} not found`);
    }

    vertex.setProperty(key, value);

    this.notifyChange({
      type: 'property',
      vertexId: vertexId,
      key,
      value,
    } as VertexPropertyChangeEvent);

    if (vertex.parentId !== null) {
      this.notifyChange({
        type: 'children',
        vertexId: vertex.parentId,
        children: [vertex], // @TODO: shoulld I set all children or rename this property?
      } as VertexChildrenChangeEvent);
    }
  }

  setTransientProperty(vertexId: string, key: string, value: any) {
    const vertex = this.getVertex(vertexId);
    if (vertex) {
      vertex.setTransientProperty(key, value);
    }

    // @TODO: add info that it's a transient property
    this.notifyChange({
      type: 'property',
      vertexId: vertexId,
      key,
      value,
    } as VertexPropertyChangeEvent);
  }

  addChangeCallback(vertexId: TreeVertexId, listener: (events: VertexChangeEvent[]) => void) {
    if (!this.changeCallbacks.has(vertexId)) {
      this.changeCallbacks.set(vertexId, new Set());
    }
    this.changeCallbacks.get(vertexId)!.add(listener);
  }

  removeChangeCallback(vertexId: TreeVertexId, listener: (events: VertexChangeEvent[]) => void) {
    this.changeCallbacks.get(vertexId)?.delete(listener);
  }

  addGlobalChangeCallback(listener: (events: VertexChangeEvent[]) => void) {
    this.globalChangeCallbacks.add(listener);
  }

  removeGlobalChangeCallback(listener: (events: VertexChangeEvent[]) => void) {
    this.globalChangeCallbacks.delete(listener);
  }

  private notifyChange(event: VertexChangeEvent) {
    let events = this.batchedEvents.get(event.vertexId);
    if (!events) {
      events = [];
      this.batchedEvents.set(event.vertexId, events);
    }

    events.push(event);

    // @TODO: have immediate events
    //this.globalChangeCallbacks.forEach(listener => listener(event));
    //this.changeCallbacks.get(event.vertexId)?.forEach(listener => listener(event));
  }

  printTree(vertexId: TreeVertexId, indent: string = "", isLast: boolean = true): string {
    const prefix = indent + (isLast ? "└── " : "├── ");
    let result = prefix + vertexId + "\n";

    let vertexName: string | null = null;

    if (vertexId !== null) {
      const vertex = this.getVertex(vertexId);
      if (vertex) {
        for (const prop of vertex.getAllProperties()) {
          if (prop.key === "_n") {
            vertexName = prop.value as string;
            //continue;
          }

          const propPrefix = indent + (isLast ? "    " : "│   ") + "• ";
          result += `${propPrefix}${prop.key}: ${JSON.stringify(prop.value)}\n`;
        }
      }
    }

    const children = this.getChildrenIds(vertexId);
    for (let i = 0; i < children.length; i++) {
      const childId = children[i];
      const isLastChild = i === children.length - 1;
      result += this.printTree(childId, indent + (isLast ? "    " : "│   "), isLastChild);
    }

    return result;
  }
}