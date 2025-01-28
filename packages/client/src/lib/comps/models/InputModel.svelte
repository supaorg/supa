<script lang="ts">
  import type { ModelProvider } from "@core/models";
  import { ProgressRing } from "@skeletonlabs/skeleton-svelte";
  import { Sparkles, CircleAlert } from "lucide-svelte/icons";
  import { providers } from "@core/providers";
  import { Modal } from "@skeletonlabs/skeleton-svelte";
  import SelectModelPopup from "../popups/SelectModelPopup.svelte";

  let { value = $bindable(), required }: { value: string; required?: boolean } =
    $props();

  let inputElement: HTMLInputElement;
  let openState = $state(false);

  function onRequestChange() {
    openState = true;
    /*
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
    */
  }

  let providerId = $state("");
  let model = $state("");
  let provider = $state<ModelProvider | null>(null);
  let error = $state("");

  function validate() {
    if (required && !value) {
      inputElement.setCustomValidity("Choose a model");
      return;
    }

    if (value && value !== "auto" && (!providerId || !model || value.split("/").length !== 2)) {
      inputElement.setCustomValidity("Invalid model: " + value);
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

    const parts = value.split("/");
    providerId = parts[0] || "";
    model = parts[1] || "";

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
      <div class="w-8 h-8 flex items-center justify-center rounded">
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
        class="w-8 h-8 bg-white flex items-center justify-center rounded"
      >
        <img class="w-5/6" src={provider.logoUrl} alt={provider.name} />
      </div>
      <div class="">
        <span class="font-semibold">{provider.name}{model ? ` — ${model}` : ''}</span>
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
    <ProgressRing value={null} />
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

<Modal
  bind:open={openState}
  contentBase="card bg-surface-100-900 p-4 space-y-4 shadow-xl max-w-screen-sm min-w-[400px] max-h-screen overflow-y-auto"
  backdropClasses="backdrop-blur-sm"
>
  {#snippet content()}
    <SelectModelPopup
      onRequestClose={() => (openState = false)}
      selectedModel={value}
      onModelSelect={(model) => {
        value = model;
      }}
    />
  {/snippet}
</Modal>