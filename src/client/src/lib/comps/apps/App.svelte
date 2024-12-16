<script lang="ts">
  import Sidebar from "$lib/comps/sidebar/Sidebar.svelte";
  import type { Snippet } from "svelte";
  import {
    Modal,
    getDrawerStore,
    initializeStores,
    type ModalComponent,
  } from "@skeletonlabs/skeleton";
  import SelectModelPopup from "../popups/SelectModelPopup.svelte";

  initializeStores();

  let { children }: { children: Snippet } = $props();

  const modalRegistry: Record<string, ModalComponent> = {
    selectModel: { ref: SelectModelPopup },
  };
</script>

<Modal components={modalRegistry} />

<div class="flex h-screen overflow-hidden">
  <aside
    class="relative w-[260px] flex-shrink-0 overflow-y-auto border-r border-surface-300-600-token"
  >
    <Sidebar />
  </aside>
  <main class="relative flex-grow h-full overflow-y-auto page-bg">
    {@render children()}
  </main>
</div>
