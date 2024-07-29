<script lang="ts">
  import { client } from "$lib/tools/client";
  import type { ModelProvider } from "@shared/models";
  import { routes } from "@shared/routes/routes";
  import { ProgressRadial, getModalStore } from "@skeletonlabs/skeleton";
  import { onMount } from "svelte";
  import { ExclamationCircle, Icon, Sparkles } from "svelte-hero-icons";

  export let value: string;
  export let required: boolean = false;

  let error = "";

  const modalStore = getModalStore();
  let inputElement: HTMLInputElement;

  function onRequestChange() {
    modalStore.trigger({
      type: "component",
      component: "selectModel",
      meta: {
        selectedModel: value ? value : null,
        onModelSelect: (model: string) => {
          value = model;
          update();
        },
      },
    });
  }

  let providerId: string;
  let model: string;
  let provider: ModelProvider | null;

  function validate() {
    if (!value) {
      inputElement.setCustomValidity("Choose a model");
      return;
    }

    if (value !== 'auto' && value.split("/").length !== 2) {
      inputElement.setCustomValidity("Invalid model:" + value);
      return;
    }

    inputElement.setCustomValidity("");
    error = "";
  }

  function onInputInvalid() {
    error = inputElement.validationMessage;
  }

  onMount(() => {
    update();
  });

  async function update() {
    if (!value) {
      provider = null;
      providerId = "";
      model = "";
      validate();
      return;
    }

    [providerId, model] = value.split("/");

    if (providerId === "auto") {
      provider = null;
      providerId = "auto";
      model = "";
      validate();
      return;
    }

    provider = null;
    provider = await client
      .get(routes.provider(providerId))
      .then((res) => res.data as ModelProvider);

    validate();
  }
</script>

{#if providerId === "auto"}
  <div class="input variant-form-material">
    <button
      type="button"
      class="flex p-4 gap-4 items-center cursor-pointer w-full"
      on:click={onRequestChange}
    >
      <div class="w-8 h-8 flex items-center justify-center rounded-token">
        <Icon src={Sparkles} class="w-5/6" />
      </div>
      <div class="">
        <span class="font-semibold">Auto — gpt4o</span>
      </div>
    </button>
  </div>
{:else if provider}
  <div class="input variant-form-material">
    <button
      type="button"
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
    <button
      type="button"
      class="btn variant-filled"
      on:invalid={onInputInvalid}
      on:click={onRequestChange}>Select a model</button
    >
  </div>
{:else}
  <div class="input variant-form-material">
    <ProgressRadial class="w-6" />
  </div>
{/if}
{#if error}
  <div class="flex intems-center mt-2 text-red-500 text-sm">
    <Icon src={ExclamationCircle} solid class="w-6 mr-2" /><span>{error}</span>
  </div>
{/if}
<input
  bind:this={inputElement}
  bind:value
  on:invalid={onInputInvalid}
  type="text"
  name="model"
  style="position: absolute; left: -9999px;"
  {required}
/>
