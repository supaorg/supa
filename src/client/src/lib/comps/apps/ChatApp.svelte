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
  let messages = $state<ThreadMessage[]>([]);
  let stickToBottomWhenLastMessageChanges = $state(false);

  let formStatus: MessageFormStatus = $derived.by(() => {
    if (messages.length === 0) {
      return "can-send-message";
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === "assistant" && lastMessage.inProgress) {
      return "ai-message-in-progress";
    }

    if (lastMessage.role === "user") {
      return "disabled";
    }

    return "can-send-message";
  });

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
    <div class="w-full max-w-3xl mx-auto px-4">
      {#each messages as message (message.id)}
        <ChatAppMessage messageId={message.id} {data} />
      {/each}
    </div>
  </div>
  <div class="min-h-min">
    <section class="max-w-3xl mx-auto py-2 px-2">
      <SendMessageForm onSend={sendMsg} onStop={stopMsg} status={formStatus} />
    </section>
  </div>
</div>
