# Layer Synchronization Proposal

## Problem

With the new race-based loading optimization in `SpaceManager`, we face a data consistency issue:

- **Fast layer** (e.g., local file) wins the race and creates the space immediately
- **Complete layer** (e.g., cloud storage) might have more operations but loads slower  
- **Outdated layer** (e.g., cached data) might be missing recent operations

This can result in:
- Incomplete spaces/app trees being created from fast-but-outdated layers
- Inconsistent data across persistence layers
- Future loads potentially getting different data depending on which layer wins

## Proposed Solution

Implement **bidirectional layer synchronization** after all layers complete loading:

### 1. Current Race-Based Flow
```
Start all layers → Race for first complete → Create space/tree → Merge others
```

### 2. Enhanced Flow with Sync
```
Start all layers → Race for first complete → Create space/tree → Merge others → Sync layers
```

### 3. Sync Points

**Space Loading** (`loadSpace` method):
- After `Promise.allSettled(layerPromises)` completes
- Find layer with most complete operations
- Sync missing operations to other layers

**App Tree Loading** (`registerTreeLoader`):
- After each app tree's `Promise.allSettled(treeLoadPromises)` completes  
- Same sync strategy per app tree

**Secrets Loading**:
- Merge all secrets from all layers
- Ensure all layers have complete secrets set

### 4. Sync Strategy

```typescript
async function syncLayerStates(results, layers, treeId) {
  const layerData = results
    .filter(r => r.status === 'fulfilled')
    .map(r => ({ layer: r.value.layer, ops: r.value.ops }));
    
  // Find most complete layer (most operations)
  const mostCompleteLayer = layerData.reduce((a, b) => 
    a.ops.length > b.ops.length ? a : b
  );
  
  // Sync all other layers to match
  for (const { layer, ops } of layerData) {
    if (layer !== mostCompleteLayer.layer) {
      const missingOps = findMissingOps(ops, mostCompleteLayer.ops);
      if (missingOps.length > 0) {
        await layer.saveTreeOps(treeId, missingOps);
      }
    }
  }
}
```

## Benefits

- **Speed**: Maintain fast space creation from race winner
- **Consistency**: All layers eventually have complete data
- **Reliability**: Future loads are consistent regardless of race winner  
- **Fault tolerance**: Works even if some layers fail
- **Efficiency**: Only sync missing operations, not full datasets

## Implementation Notes

- Use RepTree's vector state comparison for intelligent diffing
- Sync happens in background (non-blocking)
- Error handling for failed sync operations
- Consider rate limiting for frequent app tree loads
- Apply same pattern to space trees, app trees, and secrets

## Future Considerations

- Periodic background sync for long-running spaces
- Conflict resolution strategies for concurrent writes
- Layer priority settings for preferred sync sources 