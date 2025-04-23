<script lang="ts">
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import type { AppConfig } from "@core/models";
  import { Switch, Popover, Tooltip } from "@skeletonlabs/skeleton-svelte";
  import { TrashIcon } from "lucide-svelte";
  import { txtStore } from "$lib/stores/txtStore";
  import SpagesNavButton from "$lib/spages/SpagesNavButton.svelte";

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

  function deleteAppConfig() {
    $currentSpaceStore?.appConfigs.delete(config);
    deletePopoverOpen = false;
  }
</script>

<tr class="table-row">
  <td class="py-2"
    ><SpagesNavButton
      component="app-config"
      title={config.name}
      className="w-full h-full block text-left"
      props={{ configId: config.id }}
    >
      <strong>{config.name}</strong><br />{config.description}
    </SpagesNavButton></td
  >
  <td>
    <Tooltip contentBase="card bg-surface-200-800 p-2">
      {#snippet trigger()}
        <Switch
          name={"visible-" + config.id}
          checked={isVisible}
          onCheckedChange={(e) => (isVisible = e.checked)}
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
        open={deletePopoverOpen}
        onOpenChange={(e) => (deletePopoverOpen = e.open)}
        positioning={{ placement: "left" }}
        triggerBase=""
        contentBase="card bg-surface-200-800 p-4 space-y-4 max-w-[320px]"
        arrow
        arrowBackground="!bg-surface-200 dark:!bg-surface-800"
        closeOnInteractOutside={true}
        closeOnEscape={true}
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
          <div class="btn-group-vertical preset-filled-surface-500">
            <button
              class="btn preset-filled-surface-500"
              onclick={deleteAppConfig}
              >{$txtStore.appConfigPage.tableCell.deleteButton}</button
            >
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
