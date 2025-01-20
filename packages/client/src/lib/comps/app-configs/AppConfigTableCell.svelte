<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import type { AppConfig } from "@core/models";
  import { Switch, Popover, Tooltip } from '@skeletonlabs/skeleton-svelte';
  import { TrashIcon } from "lucide-svelte";
  import { txtStore } from "$lib/stores/txtStore";

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
  <td>
    <Tooltip contentBase="card bg-surface-200-800 p-2">
      {#snippet trigger()}
        <Switch
          name={"visible-" + config.id}
          bind:checked={isVisible}
        />
      {/snippet}
      {#snippet content()}
        {$txtStore.appConfigPage.tableCell.visibilityLabel}
      {/snippet}
    </Tooltip>
  </td>
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
          <Tooltip contentBase="card bg-surface-200-800 p-2">
            {#snippet trigger()}
              <TrashIcon class="w-4" />
            {/snippet}
            {#snippet content()}
              {$txtStore.appConfigPage.tableCell.deleteLabel}
            {/snippet}
          </Tooltip>
        {/snippet}
        
        {#snippet content()}
          <div class="btn-group-vertical variant-filled">
            <button class="btn variant-filled" onclick={deleteAppConfig}>{$txtStore.appConfigPage.tableCell.deleteButton}</button>
          </div>
        {/snippet}
      </Popover>
    {:else}
      <Tooltip contentBase="card bg-surface-200-800 p-2">
        {#snippet trigger()}
          <div><TrashIcon class="w-4 opacity-30" /></div>
        {/snippet}
        {#snippet content()}
          {$txtStore.appConfigPage.tableCell.deleteLabel}
        {/snippet}
      </Tooltip>
    {/if}
  </td>
</tr>
