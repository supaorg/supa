<script lang="ts">
  import type { ModelProvider } from "@shared/models";

  export let provider: ModelProvider;

  let activated = false;
</script>

<div class="card p-4 flex gap-4" class:border-token={activated}>
  <a
    href={provider.url}
    target="_blank"
    class="w-16 h-16 bg-white flex items-center justify-center rounded-token"
  >
    <img class="w-5/6" src={provider.logoUrl} alt={provider.name} />
  </a>
  <div class="flex flex-col space-y-4">
    <a href={provider.url} target="_blank" class="font-semibold"
      >{provider.name}</a
    >
    <button class="btn btn-sm variant-filled">Connect</button>
  </div>
</div>
