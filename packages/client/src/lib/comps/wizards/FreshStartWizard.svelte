<script lang="ts">
  import CenteredPage from "$lib/comps/basic/CenteredPage.svelte";
  import { createNewInBrowserSpaceSync } from "$lib/spaces/InBrowserSpaceSync";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import { swins } from "$lib/swins";
  import { authStore } from "$lib/stores/auth.svelte";

  function handleSignIn() {
    console.log("handleSignIn");
    swins.open("sign-in", {}, "Sign in");
  }

  function handleSignOut() {
    authStore.logout();
  }

  async function handleNewLocalSpace() {
    const sync = await createNewInBrowserSpaceSync();

    spaceStore.addLocalSpace(sync, "browser://" + sync.space.getId());
    spaceStore.currentSpaceId = sync.space.getId();
  }

  async function handleNewSyncedSpace() {

  }
</script>

<CenteredPage width="2xl">
  <div class="card p-8 mt-4 space-y-6 selectable-text">
    <div class="space-y-4">
      <h2 class="h2">Welcome to t69.chat</h2>
      <p>
        This is an open-source alternative to <a
          class="anchor"
          href="https://t3.chat">t3.chat</a
        >, built during a
        <a class="anchor" href="https://cloneathon.t3.chat/"
          >hackathon orginized by Theo (t3.gg)</a
        >. Here's the
        <a class="anchor" href="https://github.com/mitkury/t69"
          >source on GitHub</a
        > (start pls).
      </p>
    </div>
    <div>
      <div class="space-y-4">
        <h3 class="h4">Features</h3>
        <dl class="space-y-3">
          <div>
            <dt class="font-semibold">Workspaces</dt>
            <dd>
              Organize your conversations and assistants into separate
              workspaces
            </dd>
          </div>
          <div>
            <dt class="font-semibold">Local first</dt>
            <dd>You can use t69 without relying on t69 servers</dd>
          </div>
          <div>
            <dt class="font-semibold">Tabs like in VSCode</dt>
            <dd>You can create and switch between tabs, and split windows</dd>
          </div>
          <div>
            <dt class="font-semibold">Any AI</dt>
            <dd>
              From OpenAI and Anthropic to Ollama and any OpenAI-compatible API
            </dd>
          </div>
          <div>
            <dt class="font-semibold">Many themes</dt>
            <dd>
              You can switch between many themes and distinguish your workspaces
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <div class="flex flex-col gap-4 pt-4">
      {#if authStore.isAuthenticated}
        <div class="flex flex-col gap-2">
          <button
            class="btn btn-lg preset-filled-primary-500"
            onclick={handleNewSyncedSpace}
          >
            Let's go!
          </button>
          <small>We'll set up your workspace and you can start chatting</small>
        </div>

        <button
        class="btn btn-lg preset-outlined-surface-500"
        onclick={handleSignOut}
      >
        Sign out
      </button>
      {:else}
        <div class="flex flex-col gap-2">
          <button
            class="btn btn-lg preset-filled-primary-500"
            onclick={handleNewLocalSpace}
          >
            Go local, sync later
          </button>
          <small>You can sign in later and sync your space to a server</small>
        </div>

        <button
          class="btn btn-lg preset-outlined-surface-500"
          onclick={handleSignIn}
        >
          Sign in/up
        </button>
      {/if}
    </div>
  </div>
</CenteredPage>
