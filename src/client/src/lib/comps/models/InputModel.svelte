<script lang="ts">
  import type { ModelProvider } from "@shared/models";
  import { ProgressRadial, getModalStore } from "@skeletonlabs/skeleton";
  import { onMount } from "svelte";
  import { Sparkles, CircleAlert } from "lucide-svelte/icons";
  import { providers } from "@shared/providers";

  let { value = $bindable(), required }: { value: string; required?: boolean } = $props();

  const popupStore = getModalStore();
  let inputElement: HTMLInputElement;

  function onRequestChange() {
    popupStore.trigger({
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

  let providerId: string = $state("");
  let model: string = $state("");
  let provider: ModelProvider | null = $state(null);
  let error = $state("");

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

  $effect(() => {
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

    provider = providers.find((p) => p.id === providerId) ?? null;

    validate();
  }
</script>

{#if !providerId || providerId === "auto"}
  <div class="input variant-form-material">
    <button
      type="button"
      class="flex p-4 gap-4 items-center cursor-pointer w-full"
      onclick={onRequestChange}
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
      onclick={onRequestChange}
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
      onclick={onRequestChange}>Select a model</button
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
  oninvalid={onInputInvalid}
  type="text"
  name="model"
  style="position: absolute; left: -9999px;"
  {required}
/>
