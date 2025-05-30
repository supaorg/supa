<script lang="ts">
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import ModelProviders from "$lib/comps/models/ModelProviders.svelte";
  import CenteredPage from "$lib/comps/basic/CenteredPage.svelte";
  import SwinsNavButton from "$lib/swins/SwinsNavButton.svelte";

  let showProviderSetupPage = $state(false);
  let allowToStartNewConversationFromProviderSetup = $state(false);
  let setupProviderFromScratch = $state(false);

  $effect(() => {
    if (!spaceStore.currentSpace) {
      return;
    }

    showProviderSetupPage =
      spaceStore.currentSpace.getModelProviderConfigs().length === 0;

    const providerVertex =
      spaceStore.currentSpace.tree.getVertexByPath("providers");
    console.log(providerVertex);
    if (!providerVertex) {
      return;
    }

    const unobserve = providerVertex.observeChildren(() => {
      const hasProviders = providerVertex.children.length > 0;

      allowToStartNewConversationFromProviderSetup = hasProviders;
    });

    return () => {
      unobserve();
    };
  });
</script>

<CenteredPage>
  {#if showProviderSetupPage}
    <!-- Show model providers setup if no provider is configured -->
    <div class="w-full max-w-3xl">
      <h2 class="h3 mb-4 mt-4">Setup brains for Supa</h2>
      <p class="mb-4">
        Let's setup at least one AI model provider to start using Supa. We
        recommend setting up OpenAI, Anthropic or DeepSeek first. They have the
        most powerful models.
      </p>
      {#if allowToStartNewConversationFromProviderSetup}
        <div class="card preset-tonal p-4 space-y-4 mb-4">
          <p>We have at least one provider setup, so we can start a new conversation</p>
          <SwinsNavButton
            component="new-thread"
            title="New conversation"
            className="btn preset-filled"
          >
            Start conversation
          </SwinsNavButton>
        </div>
      {/if}
      <ModelProviders />
    </div>
  {:else}
    <!-- Show new thread UI when at least one provider is configured -->
    <div class="w-full max-w-3xl">
      <h2 class="h3 mb-4">Chat</h2>
      <p class="mb-6">@TODO: add new thread here</p>
    </div>
  {/if}
</CenteredPage>
