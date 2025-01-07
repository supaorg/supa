<script lang="ts">
  import SendMessageForm from "../forms/SendMessageForm.svelte";
  import ChatAppMessage from "./ChatAppMessage.svelte";
  import { onMount, tick } from "svelte";
  import AppConfigDropdown from "./AppConfigDropdown.svelte";
  import { ChatAppData } from "@shared/spaces/ChatAppData";
  import type { ThreadMessage } from "@shared/models";

  const mainScrollableId = "chat-messanges-scrollable";

  let { data }: { data: ChatAppData } = $props();

  let scrollableElement = $state<HTMLElement | undefined>(undefined);
  let title: string | undefined = $state();
  let messages = $state<ThreadMessage[]>([]);
  let stickToBottomWhenLastMessageChanges = $state(false);

  onMount(() => {
    const unobserve = data.observe((data) => {
      title = data.title as string;
    });

    const unobserveMessages = data.observeMessages((msgs) => {
      if (msgs.length > messages.length) {
        scrollToBottom();
      }

      messages = msgs;
    });

    return () => {
      unobserve();
      unobserveMessages();
    };
  });

  $effect(() => {
    scrollToBottom();
  });

  function scrollToBottom() {
    tick().then(() => {
      if (scrollableElement) {
        scrollableElement.scrollTo(0, scrollableElement.scrollHeight);
      }
    });
  }

  async function sendMsg(query: string) {
    data.newMessage("user", query);

    /*
    if (isFirstMessage) {
      firstMessageVertex = newMessageVertex;
    }
    */

    scrollToBottom();
  }

  async function stopMsg() {
    /*
    if (workspaceOnClient) {
      await workspaceOnClient.stopThread(threadId);
    }
    */
  }
</script>

<div class="flex flex-col w-full h-full overflow-hidden">
  <div class="min-h-min px-2">
    <div class="flex flex-1 gap-4 items-center py-2">
      <h3 class="text-lg">{title ? title : "New thread"}</h3>
      <div class="flex-grow"></div>
      <AppConfigDropdown {data} />
    </div>
  </div>
  <div
    class="flex-grow overflow-y-auto pt-2"
    bind:this={scrollableElement}
    id={mainScrollableId}
  >
    <div class="w-full max-w-3xl mx-auto px-4">
      {#each messages as message (message.id)}
        <ChatAppMessage messageId={message.id} {data} />
      {/each}
    </div>
  </div>
  <div class="min-h-min">
    <section class="max-w-3xl mx-auto py-2 px-2">
      <SendMessageForm onSend={sendMsg} onStop={stopMsg} />
    </section>
  </div>
</div>
