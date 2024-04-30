<script lang="ts">
  import CenteredPage from "$lib/comps/CenteredPage.svelte";
  import { AgentConfig } from "@shared/models";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { client } from "$lib/tools/client";


  let formElement: HTMLFormElement;
  let agentConfig: AgentConfig | null = null;

  page.subscribe((val) => {
    if (val.route.id !== "/") {
      return;
    }

    const agentIdInParams = val.url.searchParams.get("id");
    if (agentIdInParams) {
      const agentId = agentIdInParams;

      client.get("agents/" + agentId).then((response) => {
        agentConfig = response.data as AgentConfig;
      });
    }
  });
</script>


<CenteredPage>
  <h2 class="h2 pb-6">Edit Agent Configuration</h2>
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
      />
    </label>
    <label class="label">
      <span>Description</span>
      <input
        name="description"
        class="input variant-form-material"
        type="text"
        placeholder="A short description of what this agent does"
      />
    </label>
    <label class="label">
      <span>Instructions</span>
      <textarea
        name="instructions"
        class="input variant-form-material"
        rows="5"
        placeholder="Start with 'You are a ...'. Instruct the agent as if you were writing an instruction for a new employee"
      />
    </label>
    <label class="label">
      <span>New thread button (optional)</span>
      <input
        name="button"
        class="input variant-form-material"
        type="text"
        placeholder="A short actionable text for a button"
      />
    </label>
    <button type="submit" class="btn variant-filled">Update</button>
  </form>
</CenteredPage>
