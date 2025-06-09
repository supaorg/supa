<script lang="ts">
  import CenteredPage from "$lib/comps/basic/CenteredPage.svelte";
  import { createNewInBrowserSpaceSync } from "$lib/spaces/InBrowserSpaceSync";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";

  function handleSignIn() {
    // TODO: Implement sign in functionality
  }

  function handleLocal() {
    const sync = createNewInBrowserSpaceSync();

    spaceStore.addLocalSpace(sync, "browser://" + sync.space.getId());
    spaceStore.currentSpaceId = sync.space.getId();
  }
</script>

<CenteredPage>
  <div class="card p-8 mt-4 space-y-6">
    <div class="space-y-4">
      <h2 class="h2">Welcome to t69.chat</h2>
      <p class="text-lg">
        This is an open-source alternative to <a
          class="anchor"
          href="https://t3.chat">t3.chat</a
        >, a project for a
        <a class="anchor" href="https://cloneathon.t3.chat/"
          >hackathon orginized by Theo the youtuber</a
        >. Here's the
        <a class="anchor" href="https://github.com/mitkury/t69"
          >source on GitHub</a
        > (start pls).
      </p>
    </div>
    <div>
      <div class="space-y-2">
        <h3 class="h4">Features:</h3>
        <ul class="list-disc list-inside space-y-1">
          <li>Workspaces (or spaces for short)</li>
          <li>Local first (but you can sync to a server)</li>
          <li>Bring your own keys for any OpenAI compatible APIs</li>
          <li>Tabs like in VSCode</li>
          <li>Many themes</li>
          <li>Free and open source</li>
        </ul>
      </div>
    </div>

    <div class="flex flex-col gap-4 pt-4">
      <div class="flex flex-col gap-2">
        <button class="btn preset-filled-primary-500" on:click={handleLocal}>
          Go local, sync later
        </button>
        <small>You can sign in later and sync your space to a server</small>
      </div>

      <button class="btn preset-outlined-surface-500" on:click={handleSignIn}>
        Sign in/up
      </button>
    </div>
  </div>
</CenteredPage>
