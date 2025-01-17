<script lang="ts">
  import SendMessageForm from "../forms/SendMessageForm.svelte";
  import ChatAppMessage from "./ChatAppMessage.svelte";
  import { onMount, tick } from "svelte";
  import AppConfigDropdown from "./AppConfigDropdown.svelte";
  import { ChatAppData } from "@shared/spaces/ChatAppData";
  import type { ThreadMessage } from "@shared/models";
  import type { MessageFormStatus } from "../forms/messageFormStatus";

  const mainScrollableId = "chat-messanges-scrollable";

  let { data }: { data: ChatAppData } = $props();

  let scrollableElement = $state<HTMLElement | undefined>(undefined);
  let title: string | undefined = $state();
  let messageIds = $state<string[]>([]);
  let stickToBottomWhenLastMessageChanges = $state(false);
  let formStatus: MessageFormStatus = $state("can-send-message");

  let lastMessageTxt: string | null = null;

  let lastMessageId = $derived.by(() =>
    messageIds.length > 0 ? messageIds[messageIds.length - 1] : undefined,
  );

  $effect(() => {
    if (!lastMessageId) return;

    const unobserveLastMessage = data.observeMessage(lastMessageId, (msg) => {
      updateFormStatus(msg);
      if (msg.text !== lastMessageTxt) {
        lastMessageTxt = msg.text;
        scrollToBottom();
      }
    });

    return () => {
      unobserveLastMessage();
    };
  });

  function updateFormStatus(lastMessage: ThreadMessage | undefined) {
    if (!lastMessage) {
      formStatus = "can-send-message";
      return;
    }

    if (lastMessage.role === "assistant" && lastMessage.inProgress) {
      formStatus = "ai-message-in-progress";
      return;
    }

    if (lastMessage.role === "user") {
      formStatus = "disabled";
      return;
    }

    formStatus = "can-send-message";
  }

  onMount(() => {
    const unobserveTitle = data.observe((data) => {
      title = data.title as string;
    });

    messageIds = data.messageIds;

    const unobserveNewMessages = data.observeNewMessages((msgs) => {
      const newIds = data.messageIds;
      if (newIds.length > messageIds.length) {
        scrollToBottom();
      }

      messageIds = newIds;
    });

    return () => {
      unobserveTitle();
      unobserveNewMessages();
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
    const msg = data.newMessage("user", query);
    //data.askForReply(msg.id);
    scrollToBottom();
  }

  async function stopMsg() {
    data.triggerEvent("stop-message", {});
  }
</script>

<div class="flex flex-col w-full h-full overflow-hidden">
  <div class="min-h-min px-2">
    <div class="flex flex-1 gap-4 items-center py-2">
      <h3 class="text-lg pl-2">{title ? title : "New thread"}</h3>
      <div class="flex-grow"></div>
      <AppConfigDropdown {data} />
    </div>
  </div>
  <div
    class="flex-grow overflow-y-auto pt-2"
    bind:this={scrollableElement}
    id={mainScrollableId}
  >
    <div class="w-full max-w-4xl mx-auto px-4">
      {#each messageIds as messageId (messageId)}
        <ChatAppMessage {messageId} {data} />
      {/each}
    </div>
  </div>
  <div class="min-h-min">
    <section class="max-w-4xl mx-auto py-2 px-2">
      <SendMessageForm onSend={sendMsg} onStop={stopMsg} status={formStatus} />
    </section>
  </div>
</div>
