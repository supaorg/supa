<script lang="ts">
  import SendMessageForm from "../../comps/forms/SendMessageForm.svelte";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import { ChatAppData } from "@core/spaces/ChatAppData";
  import type { AppConfig } from "@core/models";
  import { newThreadDrafts } from "$lib/stores/newThreadDrafts";
  import { openChatTab } from "$lib/ttabs/layout.svelte";
  import { onMount } from "svelte";

  let { appConfig, onSend }: { appConfig?: AppConfig, onSend?: () => void } = $props();
  let targetAppConfig: AppConfig | undefined = $state(undefined);

  onMount(() => { 
    if (!appConfig) {
      targetAppConfig = spaceStore.currentSpace?.getAppConfigs()[0];
    } else {
      targetAppConfig = appConfig;
    }
  });

  const placeholder = "Write a message...";

  function onSendSubmit(msg: string) {
    if (!msg) {
      return;
    }

    // Clear draft when sending
    newThreadDrafts.update((drafts) => {
      if (!appConfig) {
        return drafts;
      }

      delete drafts[appConfig.id];
      return drafts;
    });

    newThread(msg);
  }

  async function newThread(message: string = "") {
    if (!targetAppConfig) {
      throw new Error("App config not found");
    }

    if (!spaceStore.currentSpaceConnection) {
      throw new Error("Space or app config not found");
    }

    // Create new app tree
    const newTree = ChatAppData.createNewChatTree(
      spaceStore.currentSpaceConnection.space,
      targetAppConfig.id
    );
    const chatAppData = new ChatAppData(
      spaceStore.currentSpaceConnection.space,
      newTree
    );
    chatAppData.newMessage("user", message);
    openChatTab(newTree.tree.root!.id, "New chat");
    onSend?.();
  }
</script>

<div class="space-y-4 max-w-screen-md min-w-[600px]">
  {#if targetAppConfig}
    <h3 class="h3">{targetAppConfig.name}</h3>
    <p>{targetAppConfig.description}</p>
    <SendMessageForm
      onSend={onSendSubmit}
      {placeholder}
      threadId={targetAppConfig.id}
      draftStore={newThreadDrafts}
      showConfigSelector={false}
    />
  {/if}
</div>
