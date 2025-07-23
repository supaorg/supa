<script lang="ts">
  import CenteredPage from "@supa/client/comps/basic/CenteredPage.svelte";
  import { clientState } from "@supa/client/state/clientState.svelte";
  import SpaceOpener from "../spaces/SpaceOpener.svelte";

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

    <h3 class="h3">Create or open a space</h3>
    <SpaceOpener />
  </div>
</CenteredPage>
