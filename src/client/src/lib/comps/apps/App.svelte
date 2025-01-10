<script lang="ts">
  import Sidebar from "$lib/comps/sidebar/Sidebar.svelte";
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();

</script>

<div class="flex h-screen overflow-hidden">
  <aside
    class="relative w-[260px] flex-shrink-0 overflow-y-auto border-r border-surface-200-800"
  >
  <Sidebar />
  </aside>
  <main class="relative flex-grow h-full overflow-y-auto page-bg">
    {@render children()}
  </main>
</div>
