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

{#if status === "selecting"}
  <ModelProviderSelector {selectedModel} {onModelSelect} />
  <div class="grid gap-4">
    <button
      class="btn variant-ghost-surface"
      onclick={() => (status = "managing")}>{$txtStore.modelSelection.manageProviders}</button
    >
    <button class="btn variant-filled" onclick={onRequestClose}>{$txtStore.modelSelection.done}</button>
  </div>
{:else}
  <ModelProviders />
  <div class="grid">
    <button
      class="btn variant-ghost-surface"
      onclick={() => (status = "selecting")}>{$txtStore.modelSelection.backToSelection}</button
    >
  </div>
{/if}
