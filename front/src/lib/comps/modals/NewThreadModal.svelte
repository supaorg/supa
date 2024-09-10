<script lang="ts">
  import { goto } from "$app/navigation";
  import type { AppConfig, ThreadMessage } from "@shared/models";
  import SendMessageForm from "../forms/SendMessageForm.svelte";
  import { v4 as uuidv4 } from "uuid";
  import { getModalStore } from "@skeletonlabs/skeleton";
  import { appConfigsStore, currentWorkspaceStore } from "$lib/stores/workspaceStore";

  const modalStore = getModalStore();

  const appConfigId = $modalStore[0].meta.appConfigId as string;
  let appConfig: AppConfig | undefined;
  let placeholder = "Write a message...";

  $: {
    let targetAppConfig: AppConfig | undefined;

    for (const appConfig of $appConfigsStore) {
      if (appConfig.id === appConfigId) {
        targetAppConfig = appConfig;
        break;
      }
    }

    if (targetAppConfig) {
      placeholder = targetAppConfig.button;
    }

    appConfig = targetAppConfig;

    console.log(appConfig);
  }

  let isSending = false;

  function onSend(msg: string) {
    if (!msg) {
      return;
    }

    newThread(msg);
  }

  async function newThread(message: string = "") {
    isSending = true;

    const newThread = await $currentWorkspaceStore?.createThread(appConfigId);

    if (!newThread) {
      throw new Error("Failed to create thread");
    }

    const msg = {
      id: uuidv4(),
      chatThreadId: newThread.id,
      role: "user",
      text: message,
      inProgress: null,
      createdAt: Date.now(),
      updatedAt: null,
    } as ThreadMessage;

    // Post and don't wait for the response, just go to the new thread
    // to see it live
    $currentWorkspaceStore?.postToThread(newThread.id, msg);

    goto(`/?t=${newThread.id}`);

    isSending = false;

    modalStore.close();
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
