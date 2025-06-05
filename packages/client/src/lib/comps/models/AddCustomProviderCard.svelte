<script lang="ts">
  import { PlusCircle } from "lucide-svelte";
  import { swins } from "$lib/swins";

  let {
    onProviderAdded = () => {},
  }: {
    onProviderAdded?: () => void;
  } = $props();

  function handleAdd() {
    swins.open('custom-provider-setup', {
      onSave: () => {
        onProviderAdded();
        swins.pop();
      }
    }, 'Add Custom Provider');
  }
</script>

<div class="card p-4 flex items-center justify-center">
  <button
    class="btn preset-outlined-surface-500 flex items-center gap-2"
    onclick={handleAdd}
  >
    <PlusCircle size={16} />
    <span>Add Custom Provider</span>
  </button>
</div> 