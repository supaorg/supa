<script lang="ts">
  import CenteredPage from "$lib/comps/CenteredPage.svelte";
  import { client } from "$lib/tools/client";
  import { v4 as uuidv4 } from "uuid";

  let formElement: HTMLFormElement;

  function getJsonFromForm() {
    const form = formElement;
    const formData = new FormData(form);
    const jsonObject: { [key: string]: any } = {};

    for (const [key, value] of formData.entries()) {
      jsonObject[key] = value;
    }

    jsonObject["targetLLM"] = "groq/llama3-70b-8192";
    jsonObject["id"] = uuidv4();

    return JSON.stringify(jsonObject);
  }

  function handleSubmit() {
    const json = getJsonFromForm();

    client.post("agents", json).then((response) => {
      console.log(response);
    });
  }
</script>

<CenteredPage>
  <h2 class="h2 pb-6">New Agent Configuration</h2>
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
    <button type="submit" class="btn variant-filled">Create</button>
  </form>
</CenteredPage>
