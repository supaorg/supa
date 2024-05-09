<script lang="ts">
  import { client } from "$lib/tools/client";
  import type { ModelProvider } from "@shared/models";
  import { ProgressRadial, getModalStore } from "@skeletonlabs/skeleton";

  export let value: string;

  const modalStore = getModalStore();

  function onRequestChange() {
    modalStore.trigger({
      type: "component",
      component: "selectModel",
      meta: {
        selectedModel: value ? value : null,
        onModelSelect: (model: string) => {
          value = model;
        },
      },
    });
  }

  let providerId: string;
  let model: string;
  let provider: ModelProvider | null;

  $: {
    console.log("modelPair: " + value);
    update();
  }

  async function update() {
    if (!value) {
      provider = null;
      providerId = "";
      model = "";
      return;
    }

    [providerId, model] = value.split("/");

    provider = null;
    provider = await client
      .get("providers/" + providerId)
      .then((res) => res.data as ModelProvider);
  }
</script>

{#if provider}
  <div class="input variant-form-material">
    <button
      class="flex p-4 gap-4 items-center cursor-pointer w-full"
      on:click={onRequestChange}
    >
      <div
        class="w-8 h-8 bg-white flex items-center justify-center rounded-token"
      >
        <img class="w-5/6" src={provider.logoUrl} alt={provider.name} />
      </div>
      <div class="">
        <span class="font-semibold">{provider.name} — {model}</span>
      </div>
    </button>
  </div>
{:else if !value}
  <div>
    <button class="btn variant-filled" on:click={onRequestChange}>Select a model</button>
  </div>
{:else}
  <div class="input variant-form-material">
    <ProgressRadial class="w-6" />
  </div>
{/if}
