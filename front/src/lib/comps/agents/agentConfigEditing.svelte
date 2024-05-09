<script lang="ts">
  import type { AgentConfig } from "@shared/models";
  import { onMount } from "svelte";
  import { client } from "$lib/tools/client";
  import { v4 as uuidv4 } from "uuid";
  import InputModel from "../models/InputModel.svelte";

  export let configId: string | null = null;
  let prevConfigId: string | null = null;
  let isNewAgent: boolean = configId === null;

  let formElement: HTMLFormElement;
  let agentConfig: AgentConfig | null = null;

  function init() {
    if (configId !== null) {
      prevConfigId = configId;
      console.log("configId: " + configId);
      isNewAgent = false;
      client.get("agent-configs/" + configId).then((response) => {
        agentConfig = response.data as AgentConfig;
        console.log(agentConfig);
      });
    } else {
      isNewAgent = true;
      agentConfig = {
        id: uuidv4(),
        name: "",
        description: "",
        instructions: "",
        button: "",
      } as AgentConfig;
    }
  }

  onMount(() => {
    init();
  });

  function getJsonFromForm() {
    const form = formElement;
    const formData = new FormData(form);
    const jsonObject: { [key: string]: any } = {};

    for (const [key, value] of formData.entries()) {
      jsonObject[key] = value;
    }

    /*
    jsonObject["targetLLM"] = "groq/llama3-70b-8192";
    jsonObject["id"] = uuidv4();
    */

    return JSON.stringify(jsonObject);
  }

  function handleSubmit() {
    if (isNewAgent) {
      client.post("agent-configs", agentConfig).then((response) => {
        console.log("new agent: " + response);
      });
    } else {
      client
        .post("agent-configs/" + agentConfig?.id, agentConfig)
        .then((response) => {
          console.log("updated agent: " + response);
        });
    }
  }
</script>

{#if agentConfig}
  <h2 class="h2 pb-6">
    {#if isNewAgent}
      New Agent Configuration
    {:else}
      Edit Agent Configuration
    {/if}
  </h2>
  <form
    class="space-y-4"
    bind:this={formElement}
    on:submit|preventDefault={handleSubmit}
  >
    <p class="text-sm">
      You can create you own system prompts (instructions) based on the default
      chat agent. It will be posssible to create other type of agents with tools
      and external APIs in the future versions of Supamind.
    </p>
    <label class="label">
      <span>Name</span>
      <input
        name="name"
        class="input variant-form-material"
        type="text"
        placeholder="Name your agent"
        bind:value={agentConfig.name}
      />
    </label>
    <label class="label">
      <span>Description</span>
      <input
        name="description"
        class="input variant-form-material"
        type="text"
        placeholder="A short description of what this agent does"
        bind:value={agentConfig.description}
      />
    </label>
    <label class="label">
      <span>Instructions</span>
      <textarea
        name="instructions"
        class="input variant-form-material"
        rows="7"
        placeholder="Start with 'You are a ...'. Instruct the agent as if you were writing an instruction for a new employee"
        bind:value={agentConfig.instructions}
      />
    </label>
    <div class="label">
      <span>Model</span>
      <InputModel bind:value={agentConfig.targetLLM} />
    </div>
    <label class="label">
      <span>New thread button (optional)</span>
      <input
        name="button"
        class="input variant-form-material"
        type="text"
        placeholder="A short actionable text for a button"
        bind:value={agentConfig.button}
      />
    </label>
    <button type="submit" class="btn variant-filled">
      {#if isNewAgent}
        Create
      {:else}
        Save Changes
      {/if}
    </button>
  </form>
{:else}
  <p>Loading...</p>
{/if}
