<script lang="ts">
  import type { ModelProvider } from "@shared/models";
  import { ProgressRadial, getModalStore } from "@skeletonlabs/skeleton";
  import { onMount } from "svelte";
  import { Sparkles, CircleAlert } from "lucide-svelte/icons";

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

    if (value !== "auto" && value.split("/").length !== 2) {
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

    // @TODO: implement getting provider from space
    /*
    provider =
      (await $currentWorkspaceStore?.getModelProvider(providerId)) ??
      null;
    */

    validate();
  }
</script>

{#if !providerId || providerId === "auto"}
  <div class="input variant-form-material">
    <button
      type="button"
      class="flex p-4 gap-4 items-center cursor-pointer w-full"
      on:click={onRequestChange}
    >
      <div class="w-8 h-8 flex items-center justify-center rounded-token">
        <Sparkles size={18} />
      </div>
      <div class="">
        <span class="font-semibold">Auto</span>
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
  <!--  
{:else if !value}
  <div>
    <button
      type="button"
      class="btn variant-filled"
      on:invalid={onInputInvalid}
      on:click={onRequestChange}>Select a model</button
    >
  </div>
  -->
{:else}
  <div class="input variant-form-material">
    <ProgressRadial class="w-6" />
  </div>
{/if}
{#if error}
  <div class="flex intems-center mt-2 text-red-500 text-sm">
    <CircleAlert size={18} class="w-6 mr-2" /><span>{error}</span>
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
