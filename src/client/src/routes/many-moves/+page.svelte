<script lang="ts">
  import { ReplicatedTree } from "@shared/replicatedTree/ReplicatedTree";
  import { onMount } from "svelte";
  import TreeTestSyncWrapper from "$lib/comps/test-sync/TreeTestSyncWrapper.svelte";
  import { fuzzyTest } from "@shared/replicatedTree/fuzzyTests";

  let trees: ReplicatedTree[] = [];

  onMount(() => {
    try {
      trees = fuzzyTest(5, 100, 500, true);
    } catch (error) {
      console.error(error);
    }
  });
</script>

<TreeTestSyncWrapper {trees} />
