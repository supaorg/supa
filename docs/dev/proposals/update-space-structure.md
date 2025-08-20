## Proposal: Update space structure and "app instances"

### Motivation

- **Simpler naming**: Replace "app forest" with **app instances**. The term matches what users see (instances of apps) and aligns better with typed APIs.
- **Composable spaces**: Treat a **space** as just another app kind that can reference other apps (including other spaces). This unifies how we mount and navigate everything.
- **Clear visibility**: First‑class support for public/private groupings that drive what appears in the sidebar.
- **File semantics**: Split file storage into immutable content‑addressed files and mutable uuid‑addressed blobs.

### High‑level model

- **Space tree (single per space)**
  - Global metadata (settings, providers, app‑configs)
  - `app-instances` replaces `app-forest`
  - Optional organization branches `users/`, `app-configs/`, `app-instances/{public,private}`

- **App instances (many)**
  - Each instance points to an app kind and its app tree (or a nested space)
  - Instances can live under `public` or `private` for simple visibility in UI

- **Space as an app**
  - An app kind `space` whose instance mounts another space by id
  - Enables hierarchies like a root space containing user spaces

### Example structure (conceptual)

```
space
  - users
      - dmitry  (app kind: space, points to user space)
          - app-configs
          - app-instances
              - public
                  - chat-1 (app kind: chat)
  - apps
  - app-configs
  - app-instances
      - public
      - private
```

### UI implications

- **Sidebar**: On selecting a user, load `public` from both the root space and the selected user space; render user space items primarily, with root space items mixed in as applicable.
- **Space viewer tab**: Add a tab to visualize any space as a vertex tree (like a Linux FS). Useful for debugging or power usage.

### Typed trees (type protectors)

- **RootSpaceTree**: typed accessors for `app-configs`, `app-instances`, `users`, `providers`, `settings`.
- **UserSpaceTree**: typed subset for user‑owned app instances and settings.
- **ChatAppTree**: typed interface for messages, attachments, refs to files.
- **SecretsAppTree**: lightweight tree that references encrypted secrets stored via the mutable uuid store (see Files section). The tree contains metadata and references, not raw secret bytes.

Implementation notes (high‑level):
- Use TS type guards (or Zod) for runtime validation of vertex properties per tree kind.
- Register schemas per app kind; enforce at app instance creation/load.
- Keep RepTree ops format unchanged; typed wrappers sit on top.

### App instance model

Conceptual interface for the child vertex under `app-instances`:

```ts
interface AppInstanceRef {
  id: string;                 // vertex id
  name?: string;              // display name
  appKind: 'chat' | 'files' | 'space' | 'secrets' | string;
  treeId?: string;            // for normal app trees
  spaceId?: string;           // for appKind === 'space'
  configId?: string;          // link to app-configs
  visibility?: 'public' | 'private';
  createdAt?: number;
  icon?: string;
}
```

Notes:
- `app-instances` replaces `app-forest` everywhere in code and docs.
- Cross‑space references should always carry `{ spaceId, treeId, vertexId }` to be unambiguous.

### Loading model

- On app start with a selected root space and user space:
  - Load root space tree and its `public` app instances.
  - Load selected user space tree and its `public` app instances.
  - Resolve app trees lazily when tabs/views request them.
- Nested spaces (instances with `appKind: 'space'`) are mounted on demand via `spaceId`.

### Files: immutable vs mutable stores

On disk under the space root:

```
files
  - static/sha256/{file-sha256}
  - mutable/uuid/{file-uuid}
```

- **static/sha256**: content‑addressed, immutable, deduplicated (current CAS behavior).
- **mutable/uuid**: uuid‑addressed blobs intended for values that may be rotated/overwritten (e.g., encrypted secret bundles, thumbnail caches).

Integration patterns:
- Files AppTree continues to reference immutable hashes for user files.
- SecretsAppTree stores metadata pointing to an encrypted bundle at `mutable/uuid/{id}`.
- Consider versioning for mutables: `mutable/uuid/{id}/{version}` if we need history later.

### Secrets handling (lightweight)

- Keep encryption outside CRDT ops. Store only references and minimal metadata in the tree.
- Write encrypted payloads to `files/mutable/uuid/{secretBundleId}`.
- Provide `space.setSecret(key, value)` and `space.getSecret(key)` backed by the secrets app instance.
- Piggyback on existing per‑space key material or derive a secrets key from a space master key.

### Visibility and discovery

- Use `visibility: 'public' | 'private'` on app instance vertices and optionally group under named branches for fast queries.
- Sidebar populates from `public` of the active user space plus root space `public`.

### Migration plan (incremental)

1) Introduce `app-instances` while continuing to populate `app-forest` as an alias.
2) Update loaders/UI to read from `app-instances` first, fallback to `app-forest`.
3) Migrate tests and docs to new naming.
4) Add mutable/uuid store alongside existing `sha256` CAS; introduce APIs but keep old calls working.
5) Implement `SecretsAppTree` as optional; migrate existing secrets persistence to it.
6) Flip default to `app-instances`; remove `app-forest` after deprecation window.

### Affected areas (high‑level)

- Core spaces API: rename `app-forest` to `app-instances` and add typed wrappers.
- Space loader/manager: support nested spaces as app instances; parallel loading for root+user.
- File system layer: add `files/mutable/uuid` with simple read/write APIs.
- UI: sidebar query; space viewer tab; terminology updates.
- Tests: update space and chat tests to new instance path; add tests for nested spaces and visibility.
- Docs: replace terminology and add guidance on public/private and file stores.

### Open questions

- Do we need per‑instance ACLs beyond public/private in a single‑user app today?
- Should mutable blobs support versioning natively or via separate metadata?
- How do we present nested spaces in the UI without clutter? Collapsed mounts? Breadcrumbs?
- Do we allow app instances to move between root and user spaces seamlessly (preserving ids)?

### Next steps

- Prototype `app-instances` alias and typed wrappers in core.
- Add `mutable/uuid` store with a minimal API and wire a basic `SecretsAppTree` to it.
- Build a simple Space Viewer tab to render a space’s vertices for inspection.
- Update tests and docs; run both naming schemes during transition.

### Appendix: example vertex paths

```
/ (space tree root)
  app-configs/
  app-instances/
    public/
      chat-1 { appKind: 'chat', treeId: 't-chat-1' }
    private/
  users/
    dmitry { appKind: 'space', spaceId: 'space-user-dmitry' }
```

