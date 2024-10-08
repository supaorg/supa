<script lang="ts">
  import TreeTestSyncWrapper from '$lib/comps/test-sync/TreeTestSyncWrapper.svelte';
import { Space } from '@shared/spaces/Space';
    import { onMount } from 'svelte';

  let space: Space;

  $: space = Space.newSpace('peer1');

  onMount(() => {
    let apps = space.tree.getNodeByPath('/space/apps');
    console.log(apps);

    console.log(Space.isValidSpaceTree(space.tree));
  });
</script>

<TreeTestSyncWrapper trees={[space.tree]} />
