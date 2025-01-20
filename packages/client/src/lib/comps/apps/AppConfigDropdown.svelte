<script lang="ts">
  import { onMount } from "svelte";
  import type { AppConfig } from "@core/models";
  import { Combobox } from "@skeletonlabs/skeleton-svelte";
  import { ChatAppData } from "@core/spaces/ChatAppData";
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import { txtStore } from "$lib/stores/txtStore";

  let { data }: { data: ChatAppData } = $props();

  let visibleAppConfigs = $state<AppConfig[]>([]);
  let selectedConfig = $state<string[] | undefined>(undefined);
  let comboboxData = $derived.by(() => {
    return visibleAppConfigs.map((config) => ({
      label: config.name,
      value: config.id,
    }));
  });

  onMount(() => {
    const unobserve = $currentSpaceStore?.appConfigs.observe((configs) => {
      visibleAppConfigs = configs.filter((config) => config.visible);
    });

    if (data.configId) {
      selectedConfig = [data.configId];
    }

    return () => {
      unobserve?.();
    };
  });

  $effect(() => {
    if (selectedConfig && selectedConfig.length > 0) {
      data.configId = selectedConfig[0];
    }
  });
</script>

{#if selectedConfig}
  <div class="w-[150px]">
    <Combobox
      data={comboboxData}
      bind:value={selectedConfig}
      placeholder={$txtStore.appConfigDropdown.placeholder}
    />
  </div>
{/if}
