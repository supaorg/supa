<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { v4 as uuidv4 } from "uuid";
  import { tick } from "svelte";
  import type { ThreadMessage as Message, Thread } from "@shared/models";
  import SendMessageForm from "./forms/SendMessageForm.svelte";
  import ThreadMessage from "./ThreadMessage.svelte";
  import AppConfigDropdown from "./AppConfigDropdown.svelte";
  import { ProgressRadial } from "@skeletonlabs/skeleton";
  import {
    currentWorkspaceStore,
    threadsStore,
  } from "$lib/stores/workspaceStore";

  export let threadId: string;

  let prevThreadId: string;
  let chatWrapperElement: HTMLElement;
  let canSendMessage = true;
  let messages: Message[] | null = null;
  let thread: Thread | undefined;
  let isAutoScrolling = false;
  let scrollTimeout;
  let stickToBottom = true;
  const mainScrollableId = "chat-messanges-scrollable";
  let scrollableElement: HTMLElement | null = null;

  $: workspaceOnClient = $currentWorkspaceStore;

  $: {
    if (prevThreadId !== threadId) {
      thread = $threadsStore.find((t) => t.id === threadId);
      fetchMessagesAndPossiblyJumpToBottom();
      prevThreadId = threadId;
    }
  }

  async function fetchMessagesAndPossiblyJumpToBottom() {
    if (!workspaceOnClient) return;

    let jumpToBottom = !messages || messages.length === 0;
    let targetThreadId = threadId;

    try {
      messages = await workspaceOnClient.getThreadMessages(threadId);
      if (jumpToBottom && threadId === targetThreadId) {
        scrollToBottom();
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      messages = null;
    }
  }

  async function scrollToBottom() {
    isAutoScrolling = true;
    await tick();
    const pageElement = document.getElementById(
      mainScrollableId,
    ) as HTMLElement;

    if (!pageElement) {
      console.log(
        "Couldn't scroll. An element with id " +
          mainScrollableId +
          " not found",
      );
      return;
    }

    pageElement.scrollTo(0, pageElement.scrollHeight);

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isAutoScrolling = false;
    }, 100);
  }

  async function sendMsg(query: string) {
    if (!workspaceOnClient || query === "" || !messages) {
      return;
    }

    const msg: Message = {
      id: uuidv4(),
      role: "user",
      text: query,
      inProgress: null,
      createdAt: Date.now(),
      updatedAt: null,
    };

    await workspaceOnClient.postToThread(threadId, msg);
    scrollToBottom();
  }

  async function stop() {
    if (workspaceOnClient) {
      await workspaceOnClient.stopThread(threadId);
    }
  }

  onMount(() => {
    scrollableElement = document.getElementById(mainScrollableId);
    if (scrollableElement) {
      scrollableElement.addEventListener("scroll", handleScroll);
    } else {
      console.error(
        `Element with id ${mainScrollableId} not found. We need this element to listen to scroll events.`,
      );
    }

    if (workspaceOnClient) {
      workspaceOnClient.subscribeToThreadMessages(
        threadId,
        (newMessage: Message) => {
          messages = [...(messages || []), newMessage];
          if (stickToBottom) {
            scrollToBottom();
          }
        },
      );
    }
  });

  onDestroy(() => {
    if (scrollableElement) {
      scrollableElement.removeEventListener("scroll", handleScroll);
    }

    if (workspaceOnClient) {
      workspaceOnClient.unsubscribeFromThreadMessages(threadId);
    }
  });

  function handleScroll() {
    if (isAutoScrolling || !scrollableElement) {
      return;
    }

    stickToBottom =
      scrollableElement.scrollHeight - scrollableElement.scrollTop <=
      scrollableElement.clientHeight;
  }
</script>

<div class="flex flex-col w-full h-full overflow-hidden">
  <div class="min-h-min px-2">
    <div class="flex flex-1 gap-4 items-center py-2">
      <AppConfigDropdown {threadId} />
      {#if thread && thread.title}
        <h3 class="text-lg">{thread.title}</h3>
      {/if}
    </div>
  </div>
  <div class="flex-grow overflow-y-auto pt-2" id="chat-messanges-scrollable">
    {#if !messages}
      <div class="flex items-center justify-center">
        <ProgressRadial class="w-10" />
      </div>
    {:else}
      {#each messages as message (message.id)}
        <div class="w-full max-w-3xl mx-auto px-4">
          <ThreadMessage
            {message}
            {threadId}
            isLastInThread={message.id === messages[messages.length - 1].id}
          />
        </div>
      {/each}
    {/if}
  </div>
  <div class="min-h-min">
    <section class="max-w-3xl mx-auto py-2 px-2">
      <SendMessageForm onSend={sendMsg} onStop={stop} />
    </section>
  </div>
</div>
