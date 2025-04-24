<script lang="ts">
  import { onMount } from "svelte";
  import type { AppConfig } from "@core/models";
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import { txtStore } from "$lib/stores/txtStore";
  import { Popover } from "@skeletonlabs/skeleton-svelte";
  import { ChevronUp } from "lucide-svelte";
  import SpagesNavButton from "$lib/spages/SpagesNavButton.svelte";

  let {
    configId = "",
    onChange,
  }: { configId: string; onChange?: (id: string) => void } = $props();

  let visibleAppConfigs = $state<AppConfig[]>([]);

  let currentConfig = $derived.by(() => {
    return visibleAppConfigs.find((config) => config.id === configId);
  });

  let openState = $state(false);

  onMount(() => {
    const unobserve = $currentSpaceStore?.appConfigs.observe((configs) => {
      visibleAppConfigs = configs.filter((config) => config.visible);
    });
    return () => {
      unobserve?.();
    };
  });

  function selectConfig(id: string) {
    if (onChange) onChange(id);
    openState = false;
  }
</script>

<Popover
  open={openState}
  onOpenChange={(e) => (openState = e.open)}
  positioning={{ placement: "bottom-end" }}
  contentBase="card bg-surface-100-900 p-2 space-y-2 max-w-[320px]"
  arrow
  arrowBackground="!bg-surface-100-900"
  closeOnInteractOutside={true}
  closeOnEscape={true}
>
  {#snippet trigger()}
    <button
      class="flex items-center gap-2 px-2 py-1 rounded-container transition-colors border border-secondary-100-900"
    >
      <span class="text-left truncate min-w-0">
        {#if visibleAppConfigs.length > 0}
          {#if configId}
            {#each visibleAppConfigs as config}
              {#if config.id === configId}
                {config.name}
              {/if}
            {/each}
          {:else}
            {visibleAppConfigs[0].name}
          {/if}
        {:else}
          {$txtStore.appConfigDropdown.placeholder}
        {/if}
      </span>
      <ChevronUp size={18} color="var(--color-secondary-100-900)" />
    </button>
  {/snippet}
  {#snippet content()}
    <div class="flex flex-col gap-1">
      {#each visibleAppConfigs as config (config.id)}
        <button
          class="btn btn-sm w-full text-left justify-start"
          class:preset-filled-secondary-500={config.id === configId}
          onclick={() => selectConfig(config.id)}
        >
          <span
            ><strong>{config.name}</strong><br />
            {config.description}</span
          >
        </button>
      {/each}
    </div>
    {#if currentConfig}
      <div class="flex flex-col gap-1 mt-4">
        <SpagesNavButton
          className="btn btn-sm w-full text-left justify-start"
          component="app-config"
          title="Edit Config"
          props={{ configId }}>Edit "{currentConfig?.name}" config</SpagesNavButton
        >
      </div>
    {/if}
  {/snippet}
</Popover>
