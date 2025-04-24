<script lang="ts">
  import { goto } from "$app/navigation";
  import SendMessageForm from "../forms/SendMessageForm.svelte";
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import { ChatAppData } from "@core/spaces/ChatAppData";
  import type { AppConfig } from "@core/models";
  import { newThreadDrafts } from "$lib/stores/newThreadDrafts";
  import { openChatTab } from "$lib/ttabs/ttabsLayout";

  let {
    appConfig,
    onRequestClose,
  }: { appConfig: AppConfig; onRequestClose: () => void } = $props();

  const placeholder = "Write a message...";

  function onSend(msg: string) {
    if (!msg) {
      return;
    }

    // Clear draft when sending
    newThreadDrafts.update(drafts => {
      delete drafts[appConfig.id];
      return drafts;
    });

    newThread(msg);
  }

  function onClose() {
    onRequestClose();
  }

  async function newThread(message: string = "") {
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

<h3 class="h3">{appConfig.name}</h3>
<SendMessageForm 
  onSend={onSend} 
  {placeholder} 
  threadId={appConfig.id} 
  draftStore={newThreadDrafts}
  onClose={onClose}
  showConfigSelector={false}
/>
