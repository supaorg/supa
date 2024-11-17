<script lang="ts">
  import type { AppConfig } from "@shared/models";
  import { onMount } from "svelte";
  import InputModel from "../models/InputModel.svelte";
  import { goto } from "$app/navigation";
  import { txtStore } from "$lib/stores/txtStore";
  import uuid from "@shared/uuid/uuid";

  export let configId: string | null = null;
  let prevConfigId: string | null = null;
  let isNewApp: boolean = configId === null;

  let formElement: HTMLFormElement;
  let appConfig: AppConfig | null = null;

  let disableFields = false;

  async function init() {
    if (configId !== null) {
      prevConfigId = configId;
      isNewApp = false;

      appConfig =
        // @TODO: implement getting app config from space
        //$currentWorkspaceStore?.getAppConfig(configId) ?? null;
        null;
      if (configId === "default") {
        disableFields = true;
      }
    } else {
      isNewApp = true;
      appConfig = {
        id: uuid(),
        name: "",
        description: "",
        instructions: "",
        button: "",
        targetLLM: "auto",
      } as AppConfig;
    }
  }

  onMount(async () => {
    await init();
  });

  async function handleSubmit() {
    if (!formElement.checkValidity()) {
      formElement.reportValidity();
      return;
    }

    if (!appConfig) {
      console.error("appConfig is null");
      return;
    }

    if (isNewApp) {
      // @TODO: implement saving app config to space
      //await $currentWorkspaceStore?.newAppConfig(appConfig);
      goto("/apps");
    } else {
      // @TODO: implement updating app config in space
      //await $currentWorkspaceStore?.updateAppConfig(appConfig);
    }
  }
</script>

{#if appConfig}
  <h2 class="h2 pb-6">
    {#if isNewApp}
      {$txtStore.appConfigPage.newConfigTitle}
    {:else if configId !== "default"}
      {$txtStore.appConfigPage.editConfigTitle}
    {:else}
      {$txtStore.appConfigPage.defaultConfigTitle}
    {/if}
  </h2>
  <form class="space-y-4" bind:this={formElement} on:submit|preventDefault>
    <!--
    <p class="text-sm">
      You can create you own system prompts (instructions) based on the default
      chat app. It will be posssible to create other type of apps with tools
      and external APIs in the future versions of Supamind.
    </p>
    -->
    {#if configId === "default"}
      <p>
        This is the configuration of the default chat app. You can only change
        the model it uses.<br />
        <a href="/apps/new-config" class="anchor">Go here</a> if you want to create
        a new chat app configuration.
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
        bind:value={appConfig.name}
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
        bind:value={appConfig.description}
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
        bind:value={appConfig.instructions}
        disabled={disableFields}
      />
    </label>
    <div class="label">
      <span>{$txtStore.basics.model}</span>
      <InputModel bind:value={appConfig.targetLLM} required />
    </div>
    <button type="submit" on:click={handleSubmit} class="btn variant-filled">
      {#if isNewApp}
        {$txtStore.appConfigPage.buttonCreate}
      {:else}
        {$txtStore.appConfigPage.buttonSave}
      {/if}
    </button>
  </form>
{:else}
  <p>{$txtStore.basics.loading}</p>
{/if}
