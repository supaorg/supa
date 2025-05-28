<script lang="ts">
  import type { AppConfig } from "@core/models";
  import { Switch, Popover, Tooltip } from "@skeletonlabs/skeleton-svelte";
  import {
    TrashIcon,
    GripVertical,
    Pencil,
    MessageCircle,
  } from "lucide-svelte";
  import { txtStore } from "$lib/stores/txtStore";
  import SwinsNavButton from "$lib/swins/SwinsNavButton.svelte";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";

  let { config }: { config: AppConfig } = $props();

  let isDefault = $derived(config.id === "default");
  let deletePopoverOpen = $state(false);

  function toggleVisibility() {
    const oppositeVisible = config.visible === undefined ? true : !config.visible;
    spaceStore.currentSpace?.updateAppConfig(config.id, { visible: oppositeVisible });
  }

  function deleteAppConfig() {
    spaceStore.currentSpace?.appConfigs.delete(config);
    deletePopoverOpen = false;
  }
</script>

<div class="flex gap-4 p-2 rounded">
  <!-- Sorting/drag handle -->
  <div class="cursor-grab flex-shrink-0">
    <Tooltip contentBase="card bg-surface-200-800 p-2">
      {#snippet trigger()}
        <GripVertical class="w-4 h-4 text-surface-200-800" />
      {/snippet}
      {#snippet content()}
        Drag to reorder (not yet implemented)
      {/snippet}
    </Tooltip>
  </div>

  <!-- Edit icon + Assistant name/description -->
  <div class="flex items-start gap-2 flex-1 min-w-0 group">
    <Tooltip contentBase="card bg-surface-200-800 p-2">
      {#snippet trigger()}
        <SwinsNavButton
          component="app-config"
          title="Edit Assistant"
          props={{ configId: config.id, disableFields: isDefault }}
          className="inline-flex items-center justify-center p-1 mt-0.5"
        >
          <Pencil class="w-4 h-4 group-hover:text-primary-600" />
        </SwinsNavButton>
      {/snippet}
      {#snippet content()}
        Edit Assistant
      {/snippet}
    </Tooltip>
    <div class="min-w-0">
      <SwinsNavButton
        component="app-config"
        title={config.name}
        className="block text-left min-w-0"
        props={{ configId: config.id, disableFields: isDefault }}
      >
        <strong class="truncate block">{config.name}</strong>
        <span class="block truncate">{config.description}</span>
      </SwinsNavButton>
    </div>
  </div>

  <!-- Start chat button -->
  <div>
    <Tooltip contentBase="card bg-surface-200-800 p-2">
      {#snippet trigger()}
        <button
          class="inline-flex items-center justify-center p-1 rounded"
          title="Start Chat"
          aria-label="Start Chat"
          onclick={() => {
            /* TODO: implement chat start */
          }}
        >
          <MessageCircle class="w-4 h-4" />
        </button>
      {/snippet}
      {#snippet content()}
        Start a chat with this assistant
      {/snippet}
    </Tooltip>
  </div>

  <div>
    <Tooltip contentBase="card bg-surface-200-800 p-2">
      {#snippet trigger()}
        <Switch
          name={"visible-" + config.id}
          checked={config.visible !== undefined ? config.visible : true}
          controlActive="bg-secondary-500"
          onCheckedChange={(_) => toggleVisibility()}
        />
      {/snippet}
      {#snippet content()}
        {$txtStore.appConfigPage.tableCell.visibilityLabel}
      {/snippet}
    </Tooltip>
  </div>

  <div>
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
  </div>
</div>
