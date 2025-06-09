<script lang="ts">
  import { Modal } from "@skeletonlabs/skeleton-svelte";
  import type { Snippet } from "svelte";

  let { children, open = $bindable(false) }: { children: Snippet; open: boolean } =
    $props();

</script>

<!-- TODO: fix bindable, so it's pssible to re-open the modal -->

<Modal
  bind:open={open}
  contentBase="card bg-surface-100-900 p-4 space-y-4 shadow-xl max-w-screen-sm"
  backdropClasses="backdrop-blur-sm"
>
  {#snippet content()}
    {@render children()}
  {/snippet}
</Modal>
