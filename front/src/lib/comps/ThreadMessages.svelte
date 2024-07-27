<script lang="ts">
  import { onDestroy, onMount } from "svelte";
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
    getThreadStatus,
    listenToMessages,
    postNewMessage,
    stopThread,
    threadsMessagesStore,
    unlistenMessages,
    type ThreadStatus,
  } from "$lib/stores/threadMessagesStore";

  export let threadId: string;

  let prevThreadId: string;
  let chatWrapperElement: HTMLElement;
  let canSendMessage = false;
  let messages: Message[] | null = null;
  let thread: Thread;
  let isAutoScrolling = false;
  let scrollTimeout;
  let stickToBottom = true;
  const mainScrollableId = "chat-messanges-scrollable";
  let scrollableElement: HTMLElement | null = null;

  threadsMessagesStore.subscribe((dic) => {
    const prevLastMessages =
      messages && messages.length > 0 ? messages[messages.length - 1] : null;

    messages = dic[threadId] ? dic[threadId] : null;
    canSendMessage = checkIfCanSendMessage(threadId);

    if (!messages || messages.length === 0 || !prevLastMessages) {
      return;
    }

    // If the last message from the store is different
    if (prevLastMessages.id !== messages[messages.length - 1].id) {
      scrollToBottom();
    }
    // If the last message is the same, but the text is different
    else if (prevLastMessages.text !== messages[messages.length - 1].text) {
      if (stickToBottom) {
        scrollToBottom();
      }
    }
  });

  threadsStore.subscribe(() => {
    setThread();
  });

  function setThread() {
    const targetThread = $threadsStore.find((t) => t.id === threadId);

    if (targetThread) {
      thread = targetThread;
    } else {
      console.error("Thread not found");
    }
  }

  let threadStatus: ThreadStatus;

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

    threadStatus = getThreadStatus(threadId);
  }

  async function scrollToBottom() {
    isAutoScrolling = true;
    await tick();
    const pageElement = document.getElementById(
      mainScrollableId,
    ) as HTMLElement;
    pageElement.scrollTo(0, pageElement.scrollHeight);

    clearTimeout(scrollTimeout);
    // We delay setting isAutoScrolling to false so we can detect it in the scroll event handler
    scrollTimeout = setTimeout(() => {
      isAutoScrolling = false;
    }, 100);
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

  async function stop() {
    stopThread(threadId);
  }

  onDestroy(async () => {
    if (threadId) {
      unlistenMessages(threadId);
    }

    if (scrollableElement) {
      scrollableElement.removeEventListener("scroll", handleScroll);
    }
  });
  onMount(() => {
    scrollableElement = document.getElementById(mainScrollableId);
    if (scrollableElement) {
      scrollableElement.addEventListener("scroll", handleScroll);
    } else {
      console.error(
        `Element with id ${mainScrollableId} not found. We need this element to listen to scroll events.`,
      );
    }
  });

  function handleScroll() {
    if (isAutoScrolling || !scrollableElement) {
      return;
    }

    // We set it to true if the user is at the bottom of the page
    stickToBottom =
      scrollableElement.scrollHeight - scrollableElement.scrollTop <=
      scrollableElement.clientHeight;
  }
</script>

<div class="flex flex-col h-screen">
  <div class="min-h-min px-2">
    <div class="flex flex-1 gap-2 items-center py-2">
      <AgentDropdown {threadId} />
      {#if thread.title}
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
        <div class="w-full max-w-3xl mx-auto">
          <ThreadMessage
            {message}
            {threadId}
            isLastInThread={message.id === messages[messages.length - 1].id}
          />
        </div>
      {/each}
    {/if}
  </div>
  <div class="min-h-min px-2">
    <section class="max-w-3xl mx-auto py-2">
      <SendMessageForm onSend={sendMsg} onStop={stop} {threadStatus} />
    </section>
  </div>
</div>
