<script lang="ts">
  import Sidebar from "$lib/comps/sidebar/Sidebar.svelte";
</script>

<div class="flex h-screen overflow-hidden">
  <aside
    class="relative w-[260px] flex-shrink-0 overflow-y-auto border-r border-surface-300-600-token"
  >
    <Sidebar />
  </aside>
  <main class="relative flex-grow h-full overflow-y-auto page-bg">
    <slot />
  </main>
</div>