<script lang="ts">
  import { goto } from "$app/navigation";
  import type { AppConfig, ThreadMessage } from "@shared/models";
  import SendMessageForm from "../forms/SendMessageForm.svelte";
  //import { getModalStore } from "@skeletonlabs/skeleton";
  import { currentSpaceStore } from "$lib/spaces/spaceStore";
  import { ChatAppData } from "@shared/spaces/ChatAppData";

  //const modalStore = getModalStore();
  const placeholder = "Write a message...";

  let appConfig = $state<AppConfig | undefined>(undefined);
  let isSending = $state(false);

  /*
  modalStore.subscribe((modals) => {
    if (modals.length === 0 || !modals[0].meta || !modals[0].meta.appConfigId) {
      appConfig = undefined;
      return;
    }

    const appConfigId = modals[0].meta.appConfigId as string;

    appConfig = $currentSpaceStore?.getAppConfig(appConfigId);
  });
  */

  function onSend(msg: string) {
    if (!msg) {
      return;
    }

    newThread(msg);
  }

  async function newThread(message: string = "") {
    isSending = true;

    if (!$currentSpaceStore || !appConfig) {
      throw new Error("Space or app config not found");
    }


    // Create new app tree
    const newTree = ChatAppData.createNewChatTree($currentSpaceStore, appConfig.id);
    const chatAppData = new ChatAppData($currentSpaceStore, newTree);
    chatAppData.newMessage("user", message);

    goto(`/?t=${newTree.rootVertexId}`);

    isSending = false;

    //modalStore.close();
  }
</script>

<div
  class="modal block overflow-y-auto bg-surface-100-800-token w-modal h-auto p-4 space-y-4 rounded-container-token shadow-xl"
>
  {#if isSending}
    <div>Loading...</div>
  {:else}
    {#if appConfig}
      <h3 class="h3">{appConfig.name}</h3>
    {/if}
    <SendMessageForm {onSend} {placeholder} />
  {/if}
</div>
