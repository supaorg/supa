<script lang="ts">
  import { onDestroy } from "svelte";
  import { v4 as uuidv4 } from "uuid";
  import { tick } from "svelte";
  import type { ThreadMessage as Message, Thread } from "@shared/models";
  import SendMessageForm from "./forms/SendMessageForm.svelte";
  import ThreadMessage from "./ThreadMessage.svelte";
  import AgentDropdown from "./AgentDropdown.svelte";
  import { threadsStore } from "$lib/stores/threadStore";
  import { ProgressRadial } from "@skeletonlabs/skeleton";
  import {
    checkIfCanSendMessage,
    fetchThreadMessages,
    listenToMessages,
    postNewMessage,
    threadsMessagesStore,
    unlistenMessages,
  } from "$lib/stores/threadMessagesStore";

  export let threadId: string;

  let prevThreadId: string;
  let chatWrapperElement: HTMLElement;
  let canSendMessage = false;
  let messages: Message[] | null = null;
  let thread: Thread;

  threadsMessagesStore.subscribe((dic) => {
    const prevLastMessages =
      messages && messages.length > 0 ? messages[messages.length - 1] : null;

    messages = dic[threadId] ? dic[threadId] : null;
    canSendMessage = checkIfCanSendMessage(threadId);

    // If the last previous message is not the same as the last message in the store, scroll to the bottom
    if (
      messages &&
      messages.length > 0 &&
      prevLastMessages &&
      prevLastMessages.id !== messages[messages.length - 1].id
    ) {
      scrollToBottom();
    }
  });

  function setThread() {
    const targetThread = $threadsStore.find((t) => t.id === threadId);

    if (targetThread) {
      thread = targetThread;
    } else {
      console.error("Thread not found");
    }
  }

  function fetchMessagesAndPossiblyJumpToBottom() {
    let jumpToBottom = !messages || messages.length === 0;
    let targetThreadId = threadId;

    fetchThreadMessages(targetThreadId).then(() => {
      canSendMessage = checkIfCanSendMessage(threadId);

      // In case the user navigates to another thread before the messages are fetched
      if (jumpToBottom && threadId === targetThreadId) {
        scrollToBottom();
      }
    });
  }

  $: {
    if (prevThreadId !== threadId) {
      messages = $threadsMessagesStore[threadId]
        ? $threadsMessagesStore[threadId]
        : null;

      // If we already have messages, scroll to the bottom
      if (messages) {
        scrollToBottom();
      }

      fetchMessagesAndPossiblyJumpToBottom();

      if (prevThreadId) {
        unlistenMessages(prevThreadId);
      }

      listenToMessages(threadId);

      setThread();

      prevThreadId = threadId;
    }
  }

  async function scrollToBottom() {
    await tick();
    const pageElement = document.getElementById("page") as HTMLElement;
    pageElement.scrollTo(0, pageElement.scrollHeight);
  }

  // @TODO: also move to the store
  async function sendMsg(query: string) {
    if (query === "" || !messages) {
      return;
    }

    if (!canSendMessage) {
      return;
    }

    const msg = {
      id: uuidv4(),
      chatThreadId: threadId,
      role: "user",
      text: query,
      inProgress: null,
      createdAt: Date.now(),
      updatedAt: null,
    } as Message;

    postNewMessage(threadId, msg);

    query = "";
    scrollToBottom();
  }

  onDestroy(async () => {
    if (threadId) {
      unlistenMessages(threadId);
    }
  });
</script>

<div class="flex flex-col h-full">
  <div
    class="sticky top-0 page-bg z-10 px-4 py-2 flex flex-1 gap-2 items-center"
  >
    <AgentDropdown {threadId} />
    {#if thread.title}
      <h3 class="text-lg">{thread.title}</h3>
    {/if}
  </div>
  <div
    class="flex w-full h-full flex-col max-w-3xl mx-auto justify-center items-center"
  >
    <div class="flex-1 w-full overflow-hidden">
      <section
        class="w-full overflow-y-auto space-y-4 pb-4 p-4"
        bind:this={chatWrapperElement}
      >
        {#if !messages}
          <div class="flex items-center justify-center">
            <ProgressRadial class="w-10" />
          </div>
        {:else}
          {#each messages as message (message.id)}
            <ThreadMessage {message} {threadId} isLastInThread={message.id === messages[messages.length - 1].id} />
          {/each}
        {/if}
      </section>
    </div>
    <div class="w-full max-w-3xl mx-auto sticky inset-x-0 bottom-0 page-bg">
      <section class="p-2 pt-2">
        <SendMessageForm onSend={sendMsg} disabled={!canSendMessage} />
      </section>
    </div>
  </div>
</div>
