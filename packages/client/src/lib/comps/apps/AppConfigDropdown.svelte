<script lang="ts">
  import { onMount } from "svelte";
  import type { AppConfig } from "@core/models";
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import { txtStore } from "$lib/stores/txtStore";

  let {
    configId = "",
    onChange,
  }: { configId: string; onChange?: (id: string) => void } = $props();

  let visibleAppConfigs = $state<AppConfig[]>([]);

  function handleSelectChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    // Call onChange callback if provided
    if (onChange) onChange(value);
  }

  let selectData = $derived.by(() => {
    return visibleAppConfigs.map((config) => ({
      name: config.name,
      value: config.id,
    }));
  });

  onMount(() => {
    console.log("AppConfigDropdown mounted");
    console.log("ConfigId:", configId);

    const unobserve = $currentSpaceStore?.appConfigs.observe((configs) => {
      visibleAppConfigs = configs.filter((config) => config.visible);
    });

    // Commented out: setting selectedConfig from data.configId (handled by prop now)
    // if (data.configId) {
    //   selectedConfig = data.configId;
    // }

    return () => {
      unobserve?.();
    };
  });

  // Commented out: effect that updates data.configId from selectedConfig
  // $effect(() => {
  //   if (selectedConfig) {
  //     data.configId = selectedConfig;
  //   }
  // });
</script>

<div class="w-[150px] relative z-10">
  <select
    class="select variant-form-material"
    value={configId}
    onchange={handleSelectChange}
  >
    <option value="" selected>{$txtStore.appConfigDropdown.placeholder}</option>
    {#each selectData as option}
      <option value={option.value}>{option.name}</option>
    {/each}
  </select>
</div>
