<script lang="ts">
  import { client } from "$lib/tools/client";
  import type { ModelProvider } from "@shared/models";
  import { routes } from "@shared/routes/routes";
  import { ListBox, ListBoxItem } from "@skeletonlabs/skeleton";
  import { onMount } from "svelte";
    import { Icon, Sparkles } from "svelte-hero-icons";

  export let selected = false;
  export let onSelect: (providerId: string, model: string) => void;

  let models: string[] = [];
  let showModels = false;

  onMount(async () => {});

  function onProviderClick() {
    if (selected) {
      return;
    }

    onSelect("auto", "");
  }
</script>

<div
  class="rounded-token {selected
    ? 'border border-primary-200-700-token'
    : 'border border-surface-300-600-token'}"
>
  <button
    class="flex p-4 gap-4 items-center cursor-pointer w-full"
    on:click={onProviderClick}
  >
    <div class="w-8 h-8 flex items-center justify-center rounded-token">
      <Icon src={Sparkles} class="w-5/6" />
    </div>
    <div class="flex flex-col space-y-4">
      <div>
        <span class="font-semibold"> Auto </span>
        {#if selected}
          <span class="font-semibold"> — gpt4 </span>
        {/if}
      </div>
    </div>
  </button>
</div>
