<script lang="ts">
  import CenteredPage from "../basic/CenteredPage.svelte";
  import NewThread from "./NewThread.svelte";
  import SidebarToggle from "../sidebar/SidebarToggle.svelte";
  import { clientState } from "@supa/client/state/clientState.svelte";

  let sidebarIsOpen = $derived(
    clientState.currentSpaceState?.layout.sidebar.isOpen,
  );
</script>

<div class="flex flex-col h-full w-full items-center justify-center relative">
  {#if !sidebarIsOpen}
    <div class="absolute top-2 left-2">
      <SidebarToggle />
    </div>
  {/if}
  <CenteredPage>
    <NewThread />
  </CenteredPage>
</div>
