<script lang="ts">
  import CenteredPage from "$lib/comps/basic/CenteredPage.svelte";
  import { clientState } from "$lib/state/clientState.svelte";

  function handleSignIn() {
    clientState.layout.swins.open("sign-in", {}, "Sign in");
  }

  function handleSignOut() {
    clientState.auth.logout();
  }

  async function handleCreateLocalSpace() {
    await clientState.createNewLocalSpace();
  }

  async function handleCreateSyncedSpace() {
    await clientState.createNewSyncedSpace();
  }
</script>

<CenteredPage width="2xl">
  <div class="card p-8 mt-4 space-y-6 selectable-text">
    <div class="space-y-4">
      <h2 class="h2">Welcome to Supa</h2>
      <p>
        Supa is like ChatGPT but open source. It allows to use the best AI
        models from different providers, keeps data private, and doesn't require
        a subscription.
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
            <dd>You can use Supa without relying on Supa servers</dd>
          </div>
          <div>
            <dt class="font-semibold">Tabs like in VSCode</dt>
            <dd>Create and switch between tabs, and split windows</dd>
          </div>
          <div>
            <dt class="font-semibold">Any AI</dt>
            <dd>
              From OpenAI and Anthropic to Ollama and any OpenAI-compatible API; bring your own keys
            </dd>
          </div>
          <div>
            <dt class="font-semibold">Many themes</dt>
            <dd>
              Use different themes for your workspaces; from colorful to boring
            </dd>
          </div>
          <div>
            <dt class="font-semibold">Assistants</dt>
            <dd>
              Create your own assistants with their own prompts, prompts, and models
            </dd>
          </div>
          <div>
            <dt class="font-semibold">No subscriptions</dt>
            <dd>
              Pay as you go, either for API costs from AI providers or the actual compute if you run models yourself
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <div class="flex flex-col gap-4 pt-4">
      {#if false}
        <div class="flex flex-col gap-2">
          <button
            class="btn btn-lg preset-filled-primary-500"
            onclick={handleCreateSyncedSpace}
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
            onclick={handleCreateLocalSpace}
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
