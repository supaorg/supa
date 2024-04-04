<script lang="ts">
    import { client } from "$lib/tools/client";


  let formElement;

  function getJsonFromForm(form) {
    const formData = new FormData(form);
    const jsonObject = {};

    for (const [key, value] of formData.entries()) {
      jsonObject[key] = value;
    }

    return JSON.stringify(jsonObject);
  }

  function handleSubmit() {
    const json = getJsonFromForm(formElement);
    
    client.post("agents", json).then((response) => {
      console.log(response);
    });
  }
</script>

<div class="flex h-full flex-col max-w-3xl mx-auto justify-center items-center">
  <div class="flex-1 w-full overflow-hidden">
    <form class="space-y-4" bind:this={formElement} on:submit|preventDefault={handleSubmit}>
      <h1 class="h1">New Agent</h1>
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
          name="buttonText"
          class="input variant-form-material"
          type="text"
          placeholder="A short actionable text for a button"
        />
      </label>
      <button type="submit" class="btn variant-filled">Create</button>
    </form>
  </div>
</div>
