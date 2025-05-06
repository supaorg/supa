# Dexie Ops Caching Integration Proposal

## 1. Schema

Extend `LocalDb` to include an `ops` table:

```ts
class LocalDb extends Dexie {
  pointers!: Dexie.Table<SpacePointer, string>;
  config!: Dexie.Table<ConfigEntry, string>;
  ops!: Dexie.Table<OpEntry, [string, string, number, string]>;

  constructor() {
    super('localDb');
    this.version(1).stores({
      pointers: '&id, uri, name, createdAt, lastPageUrl',
      config: '&key',
      // composite primary key on spaceId, treeId, op.id.clock, op.id.peerId
      ops: '&[spaceId+treeId+op.id.clock+op.id.peerId], [spaceId+treeId]'
    });
  }
}
export const db = new LocalDb();
```

Define `OpEntry`:

```ts
export interface OpEntry {
  spaceId: string;
  treeId: string;
  op: VertexOperation;  // includes op.id with clock & peerId
}
```

## 2. Writing Ops to Dexie

```ts
import { db } from './localDb.svelte.ts';
ops.forEach(op => {
  db.ops.add({ spaceId: this.space.getId(), treeId, op });
});
```

## 3. Loading Cached Ops

```ts
// fetch ops for a specific tree
let cached = await db.ops
  .where('[spaceId+treeId]')
  .equals([spaceId, treeId])
  .toArray();

// fetch all ops for a space (across all trees)
// let cachedAll = await db.ops.where('spaceId').equals(spaceId).toArray();

cached.sort((a, b) => {
  const { clock: aC, peerId: aP } = a.op.id;
  const { clock: bC, peerId: bP } = b.op.id;
  return aC !== bC ? aC - bC : aP.localeCompare(bP);
});
this.space.tree.merge(cached.map(e => e.op));
```

## 4. Notes

- Sorting by `op.id` ensures correct ordering.
- Index `[spaceId+treeId]` gives efficient per-tree queries.
- You can drop the secondary index and filter in-memory if desired.
