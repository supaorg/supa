<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { v4 as uuidv4 } from "uuid";
  import { marked } from "marked";
  import { tick } from "svelte";
  import type { ChatMessage, ChatThread } from "@shared/models";
  import { client } from "$lib/tools/client";
  import { goto } from "$app/navigation";
  import SendMessageForm from "./forms/SendMessageForm.svelte";
    import { Icon, Sparkles, UserCircle } from "svelte-hero-icons";

  export let threadId: string;

  let prevThreadId = threadId;
  let chatWrapperElement: HTMLElement;

  $: {
    if (prevThreadId !== threadId) {
      fetchThreadMessages();

      client.unlisten(`chats/${prevThreadId}`);
    }

    prevThreadId = threadId;
  }

  let messages: ChatMessage[] = [];
  let renderer = new marked.Renderer();

  renderer.link = function (href, title, text) {
    return `<a target="_blank" href=${href} title=${title}>${text}</a>`;
  };
  marked.setOptions({
    renderer: renderer,
  });

  function allowToSendMessage(): boolean {
    if (messages.length === 0) {
      return true;
    }

    const lastMessage = messages[messages.length - 1];

    const lastMessageIsByUser = lastMessage.role === "user";
    if (lastMessageIsByUser) {
      console.log("Last message is by user, wait for the answer");
      return false;
    }

    const lastMessageIsInProgress = lastMessage.inProgress;
    if (lastMessageIsInProgress) {
      console.log("Last message is in progress, wait for it to finish");
      return false;
    }

    return true;
  }

  async function scrollToBottom() {
    await tick();
    const pageElement = document.getElementById("page") as HTMLElement;
    pageElement.scrollTo(0, pageElement.scrollHeight);
  }

  async function sendMsg(query: string) {
    if (query === "") {
      return;
    }

    if (!allowToSendMessage()) {
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
    } as ChatMessage;

    client.post(`chats/${threadId}`, msg);

    messages.push(msg);
    messages = [...messages];

    query = "";
    scrollToBottom();
  }

  function onChatMsg(message: ChatMessage) {
    // search for the message in the list with the same id
    const index = messages.findIndex((m) => m.id === message.id);

    // If the message is not found, add it to the list
    if (index === -1) {
      messages.push(message);
      messages = [...messages];

      scrollToBottom();

      return;
    }

    // If the message is found, update it
    messages[index] = message;
    messages = [...messages];

    if (!message.inProgress) {
      scrollToBottom();
    }
  }

  async function fetchThreadMessages() {
    messages = await client.get(`chats/${threadId}`).then((res) => {
      if (res.error) {
        console.error(res.error);
        goto("/");
        return [];
      }

      const messages = res.data as ChatMessage[];
      return messages;
    });

    scrollToBottom();

    client.listen(`chats/${threadId}`, (broadcast) => {
      const chatMsg = broadcast.data as ChatMessage;
      onChatMsg(chatMsg);

      scrollToBottom();
    });
  }

  onMount(async () => {
    await fetchThreadMessages();
  });

  onDestroy(async () => {
    if (threadId) {
      client.unlisten(`chats/${threadId}`);
    }
  });

  function formatChatDate(dateInMs: number) {
    const date = new Date(dateInMs);
    return date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Use 24-hour format
    });
  }

  function handleTextareaHeightChange(newHeight: number) {}
</script>

<div class="flex h-full flex-col max-w-3xl mx-auto justify-center items-center">
  <div class="flex-1 w-full overflow-hidden">
    <section
      class="overflow-y-auto space-y-4 pb-4 p-4"
      bind:this={chatWrapperElement}
    >
      {#each messages as message}
        {#if message.role === "user"}
          <div class="flex flex-1 text-base mx-auto gap-3">
            <div class="flex-shrink-0 flex flex-col relative items-end">
              <div class="gizmo-shadow-stroke flex h-6 w-6 items-center justify-center overflow-hidden">
                <Icon src={UserCircle} mini class="h-6 w-6" />
              </div>
            </div>
            <div class="relative flex w-full flex-col">
              <header class="flex justify-between items-center">
                <p class="font-bold">You</p>
                <small class="opacity-50"
                  >{formatChatDate(message.createdAt)}</small
                >
              </header>
              <div class="leading-relaxed">
                {@html marked(message.text ? message.text : "Loading...")}
              </div>
              <div class="mt-1 flex justify-start gap-3 empty:hidden h-7">
                <div class="h-7"></div>
              </div>
            </div>
          </div>
        {:else}
          <div class="flex flex-1 text-base mx-auto gap-3">
            <div class="flex-shrink-0 flex flex-col relative items-end">
              <div class="gizmo-shadow-stroke flex h-6 w-6 items-center justify-center overflow-hidden">
                <Icon src={Sparkles} mini class="h-6 w-6" />
              </div>
            </div>
            <div class="relative flex w-full flex-col">
              <header class="flex justify-between items-center">
                <p class="font-bold">AI</p>
              </header>
              <div class="leading-relaxed">
                {@html marked(message.text ? message.text : "Loading...")}
              </div>
              <div class="mt-1 flex justify-start gap-3 empty:hidden h-7">
                <div class="h-7"></div>
              </div>
            </div>
          </div>
        {/if}
      {/each}
    </section>
  </div>
  <div
    class="w-full max-w-3xl mx-auto sticky inset-x-0 bottom-0 page-bg"
  >
    <section class="p-2 pt-2">
      <SendMessageForm
        onSend={sendMsg}
        onHeightChange={handleTextareaHeightChange}
      />
    </section>
  </div>
</div>
