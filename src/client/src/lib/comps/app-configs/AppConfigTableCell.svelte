<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import type { AppConfig } from "@shared/models";
  import { Switch, Popover } from '@skeletonlabs/skeleton-svelte';
  import { TrashIcon } from "lucide-svelte";

  let { config }: { config: AppConfig } = $props();

  let isVisible: boolean = $state(
    config.visible !== undefined ? config.visible : true,
  );
  let isDefault = $derived(config.id === "default");
  let deletePopoverOpen = $state(false);

  $effect(() => {
    setAppConfigVisibility(isVisible);
  });

  function setAppConfigVisibility(visible: boolean) {
    if (visible !== config.visible) {
      $currentSpaceStore?.updateAppConfig(config.id, { visible });
    }
  }
 
  function closeDeletePopover() {
    deletePopoverOpen = false;
  }

  function deleteAppConfig() {
    $currentSpaceStore?.appConfigs.delete(config);
    closeDeletePopover();
  }
</script>

<tr class="table-row">
  <td class="py-2"
    ><a href={"/apps/edit-config?id=" + config.id} class="w-full h-full block"
      ><strong>{config.name}</strong><br />{config.description}</a
    ></td
  >
  <td
    ><Switch
      name={"visible-" + config.id}
      bind:checked={isVisible}
    /></td
  >
  <td>
    {#if !isDefault}
      <Popover
        bind:open={deletePopoverOpen}
        positioning={{ placement: 'left' }}
        triggerBase=""
        contentBase="card bg-surface-200-800 p-4 space-y-4 max-w-[320px]"
        arrow
        arrowBackground="!bg-surface-200 dark:!bg-surface-800"
      >
        {#snippet trigger()}
          <TrashIcon class="w-4" />
        {/snippet}
        
        {#snippet content()}
          <div class="btn-group-vertical variant-filled">
            <button class="btn variant-filled" onclick={deleteAppConfig}>Delete</button>
          </div>
        {/snippet}
      </Popover>
    {:else}
      <div><TrashIcon class="w-4 opacity-30" /></div>
    {/if}
  </td>
</tr>
