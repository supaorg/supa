<script lang="ts">
  import { goto } from "$app/navigation";
  import { spacePointersStore, currentSpaceIdStore, getCurrentSpacePointer } from "$lib/spaces/spaceStore";
  import SpaceOptionsPopup from "$lib/comps/popups/SpaceOptionsPopup.svelte";

  function selectSpace(spaceId: string) {
    currentSpaceIdStore.set(spaceId);
  }
</script>

{#if $spacePointersStore.length > 0}
  <div class="space-y-2">
    {#each $spacePointersStore as space (space.id)}
      <div 
        class="p-4 rounded-lg bg-surface-200-800-token border-2 {space.id === $currentSpaceIdStore ? 'border-primary-500' : 'border-surface-100-900'} hover:bg-surface-300-600-token cursor-pointer flex items-center justify-between"
      >
        <div
          on:click={() => selectSpace(space.id)}
          on:keydown={(e) => e.key === 'Enter' && selectSpace(space.id)}
          role="button"
          tabindex="0"
          class="flex-grow"
        >
          <div class="font-semibold">{space.name || "Unnamed Space"}</div>
          <div class="text-sm opacity-70">{space.uri}</div>
        </div>

        <SpaceOptionsPopup spaceId={space.id} />
      </div>
    {/each}
  </div>
{:else}
  <p class="text-center opacity-70">No spaces found</p>
{/if}

<style>
  .space-y-2 > :not([hidden]) ~ :not([hidden]) {
    margin-top: 0.5rem;
  }
</style>