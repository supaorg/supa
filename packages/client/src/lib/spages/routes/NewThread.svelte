<script lang="ts">
  import SendMessageForm from "../../comps/forms/SendMessageForm.svelte";
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import { ChatAppData } from "@core/spaces/ChatAppData";
  import type { AppConfig } from "@core/models";
  import { newThreadDrafts } from "$lib/stores/newThreadDrafts";
  import { openChatTab } from "$lib/ttabs/ttabsLayout";
    import { spages } from "../spagesLayout";

  let { appConfig }: { appConfig?: AppConfig } = $props();

  const placeholder = "Write a message...";

  function onSend(msg: string) {
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

  function onClose() {
    spages.clear();
  }

  async function newThread(message: string = "") {
    if (!appConfig) {
      throw new Error("App config not found");
    }

    if (!$currentSpaceStore) {
      throw new Error("Space or app config not found");
    }

    // Create new app tree
    const newTree = ChatAppData.createNewChatTree(
      $currentSpaceStore,
      appConfig.id,
    );
    const chatAppData = new ChatAppData($currentSpaceStore, newTree);
    chatAppData.newMessage("user", message);
    openChatTab(newTree.tree.rootVertexId, "New chat");
    onClose();
  }
</script>

<div class="space-y-4 max-w-screen-md min-w-[600px]">
  {#if appConfig}
    <h3 class="h3">{appConfig.name}</h3>
    <p>{appConfig.description}</p>
    <SendMessageForm
      {onSend}
      {placeholder}
      threadId={appConfig.id}
      draftStore={newThreadDrafts}
      {onClose}
      showConfigSelector={false}
    />
  {/if}
</div>
