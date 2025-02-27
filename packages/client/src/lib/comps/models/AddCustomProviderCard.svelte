<script lang="ts">
  import { PlusCircle } from "lucide-svelte";
  import CustomProviderForm from "./CustomProviderForm.svelte";
  
  let showForm = $state(false);
  
  let {
    onProviderAdded = () => {},
  }: {
    onProviderAdded?: (providerId: string) => void;
  } = $props();
  
  function handleSave(providerId: string) {
    showForm = false;
    onProviderAdded(providerId);
  }
</script>

<div class="card p-4 flex gap-4">
  {#if !showForm}
    <div class="w-16 h-16 flex flex-shrink-0 items-center justify-center rounded bg-surface-200-700-token">
      <PlusCircle size={32} />
    </div>
    <div class="flex flex-col flex-grow space-y-4">
      <div class="flex items-center">
        <span class="font-semibold">Add Custom Provider</span>
      </div>
      <div class="flex flex-grow gap-2">
        <button
          class="btn btn-md preset-filled-primary-500 flex-grow"
          on:click={() => (showForm = true)}
        >
          Add Provider
        </button>
      </div>
    </div>
  {:else}
    <div class="w-full">
      <CustomProviderForm 
        onSave={handleSave} 
        onCancel={() => (showForm = false)} 
      />
    </div>
  {/if}
</div> 