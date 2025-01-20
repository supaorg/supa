<script lang="ts">
  import InputModel from "../models/InputModel.svelte";
  import { goto } from "$app/navigation";
  import { txtStore } from "$lib/stores/txtStore";
  import uuid from "@core/uuid/uuid";
  import { currentSpaceStore } from "$lib/spaces/spaceStore";

  let {
    configId,
    disableFields = false,
  }: { configId?: string; disableFields?: boolean } = $props();

  let isNewApp = $derived(!configId);

  let name = $state("");
  let description = $state("");
  let instructions = $state("");
  let targetLLM = $state("auto");

  let defaultConfigMessage = $derived(
    $txtStore.appConfigPage.defaultConfigMessage.replace(
      '{defaultConfigGotoNew}', 
      $txtStore.appConfigPage.defaultConfigGotoNew
    )
  );

  $effect(() => {
    if (configId) {
      const config = $currentSpaceStore?.getAppConfig(configId);
      if (config) {
        name = config.name;
        description = config.description;
        instructions = config.instructions;
        targetLLM = config.targetLLM || "auto";
      }
    }
  });

  let formElement = $state<HTMLFormElement | undefined>(undefined);

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (!formElement) {
      console.error("formElement is undefined");
      return;
    }

    if (!formElement.checkValidity()) {
      formElement.reportValidity();
      return;
    }

    if (!configId) {
      $currentSpaceStore?.insertIntoArray("app-configs", {
        id: uuid(),
        name: name,
        description: description,
        instructions: instructions,
        targetLLM: targetLLM,
      });

      goto("/apps");
    } else {
      $currentSpaceStore?.updateAppConfig(configId, {
        name: name,
        description: description,
        instructions: instructions,
        targetLLM: targetLLM,
      });
    }
  }
</script>

<h2 class="h2 pb-6">
  {#if isNewApp}
    {$txtStore.appConfigPage.newConfigTitle}
  {:else if configId !== "default"}
    {$txtStore.appConfigPage.editConfigTitle}
  {:else}
    {$txtStore.appConfigPage.defaultConfigTitle}
  {/if}
</h2>
<form class="space-y-4" bind:this={formElement}>
  {#if configId === "default"}
    <p>
      {@html defaultConfigMessage}
    </p>
  {/if}
  <label class="label">
    <span>{$txtStore.basics.name}</span>
    <input
      name="name"
      class="input variant-form-material"
      type="text"
      placeholder={$txtStore.appConfigPage.namePlaceholder}
      required
      bind:value={name}
      disabled={disableFields}
    />
  </label>
  <label class="label">
    <span>{$txtStore.basics.description}</span>
    <input
      name="description"
      class="input variant-form-material"
      type="text"
      placeholder={$txtStore.appConfigPage.descriptionPlaceholder}
      required
      bind:value={description}
      disabled={disableFields}
    />
  </label>
  <label class="label">
    <span>{$txtStore.basics.instructions}</span>
    <textarea
      name="instructions"
      class="input variant-form-material"
      rows="7"
      placeholder={$txtStore.appConfigPage.instructionsPlaceholder}
      required
      bind:value={instructions}
      disabled={disableFields}
    ></textarea>
  </label>
  <div class="label">
    <span>{$txtStore.basics.model}</span>
    <InputModel bind:value={targetLLM} required />
  </div>
  <button type="submit" onclick={handleSubmit} class="btn variant-filled">
    {#if isNewApp}
      {$txtStore.appConfigPage.buttonCreate}
    {:else}
      {$txtStore.appConfigPage.buttonSave}
    {/if}
  </button>
</form>
