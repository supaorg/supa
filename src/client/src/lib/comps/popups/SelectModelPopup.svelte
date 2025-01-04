<script lang="ts">
  //import { getModalStore } from "@skeletonlabs/skeleton";
  import ModelProviderSelector from "../models/ModelProviderSelector.svelte";
  import ModelProviders from "../models/ModelProviders.svelte";

  type Status = "selecting" | "managing";
  let status: Status = $state("selecting");

  /*
  const modalStore = getModalStore();
  const selectedModel = $modalStore[0].meta.selectedModel as string;
  const onModelSelect = $modalStore[0].meta.onModelSelect as (
    model: string,
  ) => void;
  */
  
  const selectedModel: string | null = $state(null);
  const onModelSelect: (model: string) => void = () => {};
</script>

<div class="card p-4 w-modal shadow-xl space-y-4 overflow-y-auto max-h-screen">
  {#if status === "selecting"}
    <ModelProviderSelector {selectedModel} {onModelSelect} />
    <div class="grid gap-4">
      <button
        class="btn variant-ghost-surface"
        onclick={() => (status = "managing")}>Manage model providers</button
      >
      <button class="btn variant-filled" onclick={() => {}}
        >Done</button
      >
    </div>
  {:else}
    <ModelProviders />
    <div class="grid">
      <button
        class="btn variant-ghost-surface"
        onclick={() => (status = "selecting")}>Back to selecting a model</button
      >
    </div>
  {/if}
</div>
