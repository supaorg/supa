<script lang="ts">
  import { txtStore } from "$lib/stores/txtStore";
  let profileFormElement: HTMLFormElement;
</script>

<h2 class="h2 pb-6">{$txtStore.settingsPage.title}</h2>
<div class="card p-4 space-y-4 mb-4">
  <form
    class="space-y-4"
    bind:this={profileFormElement}
    on:submit|preventDefault
  >
    <h3 class="h3">Profile</h3>
    <label class="label">
      <span>Your name</span>
      <input
        name="name"
        class="input variant-form-material"
        type="text"
        placeholder=""
      />
    </label>
    <label class="label">
      <span>About you</span>
      <textarea
        name="instructions"
        class="input variant-form-material"
        rows="3"
        placeholder=""
      />
    </label>
  </form>
</div>

<div class="card p-4 space-y-4 mb-4">
  <form
    class="space-y-4"
    bind:this={profileFormElement}
    on:submit|preventDefault
  >
    <h3 class="h3">Workspace</h3>
    <label class="label">
      <span>Path to the workspace</span>
      ...
    </label>
    <label class="label">
      <span>Name of the workspace</span>
      <input
        name="name"
        class="input variant-form-material"
        type="text"
        placeholder=""
      />
    </label>
  </form>
</div>
