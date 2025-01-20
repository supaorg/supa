<script lang="ts">
  import { ReplicatedTree } from "@core/replicatedTree/ReplicatedTree";
  import { onMount } from "svelte";
  import TreeTestSyncWrapper from "$lib/comps/test-sync/TreeTestSyncWrapper.svelte";
  import { fuzzyTest } from "@core/replicatedTree/fuzzyTests";

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
