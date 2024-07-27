<script lang="ts">
  import type { AgentConfig } from "@shared/models";
  import { onMount } from "svelte";
  import { client } from "$lib/tools/client";
  import { v4 as uuidv4 } from "uuid";
  import InputModel from "../models/InputModel.svelte";
  import { goto } from "$app/navigation";
  import { txtStore } from "$lib/stores/txtStore";
  import { routes } from "@shared/routes/routes";

  export let configId: string | null = null;
  let prevConfigId: string | null = null;
  let isNewAgent: boolean = configId === null;

  let formElement: HTMLFormElement;
  let agentConfig: AgentConfig | null = null;

  let disableFields = false;

  function init() {
    if (configId !== null) {
      prevConfigId = configId;
      console.log("configId: " + configId);
      isNewAgent = false;
      client.get(routes.appConfig(configId)).then((response) => {
        agentConfig = response.data as AgentConfig;
      });

      if (configId === "default") {
        disableFields = true;
      }
    } else {
      isNewAgent = true;
      agentConfig = {
        id: uuidv4(),
        name: "",
        description: "",
        instructions: "",
        button: "",
        targetLLM: "auto",
      } as AgentConfig;
    }
  }

  onMount(() => {
    init();
  });

  function handleSubmit() {
    if (!formElement.checkValidity()) {
      formElement.reportValidity();
      return;
    }

    if (isNewAgent) {
      client.post(routes.appConfigs, agentConfig).then((response) => {
        console.log("new agent: " + response);
      });

      goto("/agents");
    } else {
      client
        .post(routes.appConfig(agentConfig?.id), agentConfig)
        .then((response) => {
          console.log("updated agent: " + response);
        });
    }
  }
</script>

{#if agentConfig}
  <h2 class="h2 pb-6">
    {#if isNewAgent}
      {$txtStore.agentConfigPage.newConfigTitle}
    {:else if configId !== "default"}
      {$txtStore.agentConfigPage.editConfigTitle}
    {:else}
      {$txtStore.agentConfigPage.defaultConfigTitle}
    {/if}
  </h2>
  <form class="space-y-4" bind:this={formElement} on:submit|preventDefault>
    <!--
    <p class="text-sm">
      You can create you own system prompts (instructions) based on the default
      chat agent. It will be posssible to create other type of agents with tools
      and external APIs in the future versions of Supamind.
    </p>
    -->
    <!--
      @TODO: print the description of the agent that describes how the agent works
    -->
    {#if configId === "default"}
      <p>
        This is the configuration of the default chat agent. You can only change
        the model it uses.<br />
        <a href="/apps/new-config" class="anchor">Go here</a> if you want to create
        a new agent configuration.
      </p>
    {/if}
    <label class="label">
      <span>{$txtStore.basics.name}</span>
      <input
        name="name"
        class="input variant-form-material"
        type="text"
        placeholder={$txtStore.agentConfigPage.namePlaceholder}
        required
        bind:value={agentConfig.name}
        disabled={disableFields}
      />
    </label>
    <label class="label">
      <span>{$txtStore.basics.description}</span>
      <input
        name="description"
        class="input variant-form-material"
        type="text"
        placeholder={$txtStore.agentConfigPage.descriptionPlaceholder}
        required
        bind:value={agentConfig.description}
        disabled={disableFields}
      />
    </label>
    <label class="label">
      <span>{$txtStore.basics.instructions}</span>
      <textarea
        name="instructions"
        class="input variant-form-material"
        rows="7"
        placeholder={$txtStore.agentConfigPage.instructionsPlaceholder}
        required
        bind:value={agentConfig.instructions}
        disabled={disableFields}
      />
    </label>
    <div class="label">
      <span>{$txtStore.basics.model}</span>
      <InputModel bind:value={agentConfig.targetLLM} required />
    </div>
    <button type="submit" on:click={handleSubmit} class="btn variant-filled">
      {#if isNewAgent}
        {$txtStore.agentConfigPage.buttonCreate}
      {:else}
        {$txtStore.agentConfigPage.buttonSave}
      {/if}
    </button>
  </form>
{:else}
  <p>{$txtStore.basics.loading}</p>
{/if}
