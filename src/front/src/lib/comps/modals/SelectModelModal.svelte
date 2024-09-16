<script lang="ts">
  import { getModalStore } from "@skeletonlabs/skeleton";
  import ModelProviderSelector from "../models/ModelProviderSelector.svelte";
  import ModelProviders from "../models/ModelProviders.svelte";

  type State = "selecting" | "managing";
  let state: State = "selecting";

  const modalStore = getModalStore();
  const selectedModel = $modalStore[0].meta.selectedModel as string;
  const onModelSelect = $modalStore[0].meta.onModelSelect as (
    model: string,
  ) => void;
</script>

<div class="card p-4 w-modal shadow-xl space-y-4 overflow-y-auto max-h-screen">
  {#if state === "selecting"}
    <ModelProviderSelector {selectedModel} {onModelSelect} />
    <div class="grid gap-4">
      <button
        class="btn variant-ghost-surface"
        on:click={() => (state = "managing")}>Manage model providers</button
      >
      <button class="btn variant-filled" on:click={() => modalStore.close()}
        >Done</button
      >
    </div>
  {:else}
    <ModelProviders />
    <div class="grid">
      <button
        class="btn variant-ghost-surface"
        on:click={() => (state = "selecting")}>Back to selecting a model</button
      >
    </div>
  {/if}
</div>
