<script lang="ts">
  import CenteredPage from "../basic/CenteredPage.svelte";
  import NewThread from "./NewThread.svelte";
  import { sidebar } from "$lib/state/layout.svelte";
  import SidebarToggle from "../sidebar/SidebarToggle.svelte";
</script>

<div class="flex flex-col h-full w-full items-center justify-center relative">
  {#if !sidebar.isOpen}
    <div class="absolute top-2 left-2">
      <SidebarToggle />
    </div>
  {/if}
  <CenteredPage>
    <NewThread />
  </CenteredPage>
</div>
