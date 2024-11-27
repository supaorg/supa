<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import type { ReplicatedTree } from "@shared/replicatedTree/ReplicatedTree";
  import TreeTestSyncWrapper from "$lib/comps/test-sync/TreeTestSyncWrapper.svelte";

  let tree: ReplicatedTree | null = null;

  currentSpaceStore.subscribe((space) => {
    if (space) {
      tree = space.tree;
    }
  });
</script>

{#if tree}
  <TreeTestSyncWrapper trees={[tree]} />
{/if}
