<script lang="ts">
  import ModelProviderSelector from "../models/ModelProviderSelector.svelte";
  import ModelProviders from "../models/ModelProviders.svelte";
  import { txtStore } from "$lib/stores/txtStore";

  let {
    selectedModel,
    onModelSelect,
    onRequestClose,
  }: {
    onRequestClose: () => void;
    selectedModel: string | null;
    onModelSelect: (model: string) => void;
  } = $props();

  type Status = "selecting" | "managing";
  let status: Status = $state("selecting");
</script>

<div class="md:min-w-[500px]">
  {#if status === "selecting"}
    <ModelProviderSelector {selectedModel} {onModelSelect} />
    <div class="grid gap-4 mt-4">
      <button
        class="btn preset-outlined-surface-500"
        onclick={() => (status = "managing")}>{$txtStore.modelSelection.manageProviders}</button
      >
      <button class="btn preset-filled-surface-500" onclick={onRequestClose}>{$txtStore.modelSelection.done}</button>
    </div>
  {:else}
    <ModelProviders />
    <div class="grid">
      <button
        class="btn preset-outlined-surface-500"
        onclick={() => (status = "selecting")}>{$txtStore.modelSelection.backToSelection}</button
      >
    </div>
  {/if}
</div>
