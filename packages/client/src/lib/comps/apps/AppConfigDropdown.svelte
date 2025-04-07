<script lang="ts">
  import { onMount } from "svelte";
  import type { AppConfig } from "@core/models";
  import { ChatAppData } from "@core/spaces/ChatAppData";
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import { txtStore } from "$lib/stores/txtStore";

  let { data }: { data: ChatAppData } = $props();

  let visibleAppConfigs = $state<AppConfig[]>([]);
  let selectedConfig = $state<string>("");
  let selectData = $derived.by(() => {
    return visibleAppConfigs.map((config) => ({
      name: config.name,
      value: config.id,
    }));
  });

  onMount(() => {
    const unobserve = $currentSpaceStore?.appConfigs.observe((configs) => {
      visibleAppConfigs = configs.filter((config) => config.visible);
    });

    if (data.configId) {
      selectedConfig = data.configId;
    }

    return () => {
      unobserve?.();
    };
  });

  $effect(() => {
    if (selectedConfig) {
      data.configId = selectedConfig;
    }
  });
</script>

<div class="w-[150px] relative z-10">
  <select
    class="select variant-form-material"
    bind:value={selectedConfig}
  >
    <option value="" disabled selected>{$txtStore.appConfigDropdown.placeholder}</option>
    {#each selectData as option}
      <option value={option.value}>{option.name}</option>
    {/each}
  </select>
</div>
