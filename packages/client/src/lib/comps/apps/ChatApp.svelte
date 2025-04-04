<script lang="ts">
  import SendMessageForm from "../forms/SendMessageForm.svelte";
  import ChatAppMessage from "./ChatAppMessage.svelte";
  import { onMount, tick } from "svelte";
  import { timeout } from "@core/tools/timeout";
  import AppConfigDropdown from "./AppConfigDropdown.svelte";
  import { ChatAppData } from "@core/spaces/ChatAppData";
  import type { ThreadMessage } from "@core/models";
  import type { MessageFormStatus } from "../forms/messageFormStatus";

  let { data }: { data: ChatAppData } = $props();
  let scrollableElement = $state<HTMLElement | undefined>(undefined);
  let title: string | undefined = $state();
  let messageIds = $state<string[]>([]);
  let shouldAutoScroll = $state(true);
  let formStatus: MessageFormStatus = $state("can-send-message");
  let isProgrammaticScroll = $state(true);
  let isEditingTitle = $state(false);
  let lastMessageId = $derived.by(() =>
    messageIds.length > 0 ? messageIds[messageIds.length - 1] : undefined,
  );

  let lastMessageTxt: string | null = null;
  let titleInput: HTMLInputElement;
  let programmaticScrollTimeout: (() => void) | undefined;

  function isAtBottom() {
    if (!scrollableElement) return false;

    const threshold = 0;
    return (
      scrollableElement.scrollHeight -
        scrollableElement.scrollTop -
        scrollableElement.clientHeight <=
      threshold
    );
  }

  function handleScroll() {
    // We only detect when the user scrolls (not when it's scrolled programmatically)
    if (!isProgrammaticScroll) {
      shouldAutoScroll = isAtBottom();
    }
  }

  $effect(() => {
    if (!lastMessageId) return;

    const unobserveLastMessage = data.observeMessage(lastMessageId, (msg) => {
      updateFormStatus(msg);
      if (msg.text !== lastMessageTxt) {
        lastMessageTxt = msg.text;
        if (msg.role === "assistant") {
          scrollOnlyIfAutoscroll();
        }
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

  function adjustInputWidth() {
    if (!titleInput) return;
    // Create a temporary span to measure text
    const span = document.createElement("span");
    // Copy the input's font styles to the span for accurate measurement
    const styles = window.getComputedStyle(titleInput);
    span.style.font = styles.font;
    span.style.padding = styles.padding;
    span.style.visibility = "hidden";
    span.style.position = "absolute";
    span.style.whiteSpace = "pre";
    // Add some padding for cursor space
    span.textContent = titleInput.value + "W";
    document.body.appendChild(span);
    const width = span.offsetWidth;
    document.body.removeChild(span);
    // Set the input width
    titleInput.style.width = `${width}px`;
  }

  onMount(() => {
    const unobserveTitle = data.observe((data) => {
      title = data.title as string;
      // Adjust width after title updates
      timeout(adjustInputWidth, 0);
    });

    messageIds = data.messageIds;

    const unobserveNewMessages = data.observeNewMessages((msgs) => {
      const newIds = data.messageIds;
      scrollToBottom();
      messageIds = newIds;
    });

    tick().then(() => {
      scrollToBottom();
    });

    return () => {
      unobserveTitle();
      unobserveNewMessages();
    };
  });

  function scrollToBottom() {
    if (!scrollableElement) {
      console.warn("scrollable element not found");
      return;
    }

    isProgrammaticScroll = true;
    scrollableElement.scrollTo(0, scrollableElement.scrollHeight);
    // Reset the flag after the scroll animation would have completed
    programmaticScrollTimeout?.();
    programmaticScrollTimeout = timeout(() => {
      isProgrammaticScroll = false;
    }, 100);
  }

  function scrollOnlyIfAutoscroll() {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }

  async function sendMsg(query: string) {
    data.newMessage("user", query);

    timeout(scrollToBottom, 100);
  }

  async function stopMsg() {
    data.triggerEvent("stop-message", {});
  }

  function updateTitle(newTitle: string) {
    if (newTitle.trim() !== "") {
      data.rename(newTitle);
    }
  }
</script>

<div class="flex flex-col w-full h-full overflow-hidden">
  <div class="min-h-min px-2">
    <div class="flex flex-1 gap-4 items-center py-2">
      <div class="flex-1 min-w-0">
        <input
          bind:this={titleInput}
          type="text"
          value={title ? title : "New thread"}
          class="text-lg pl-2 bg-transparent border-0 rounded outline-none transition-colors overflow-hidden text-ellipsis"
          class:ring={isEditingTitle}
          class:ring-primary-300-700={isEditingTitle}
          onfocus={() => (isEditingTitle = true)}
          onblur={(e) => {
            isEditingTitle = false;
            updateTitle(e.currentTarget.value);
          }}
          onkeydown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
            adjustInputWidth();
          }}
          oninput={adjustInputWidth}
        />
      </div>
      <AppConfigDropdown {data} />
    </div>
  </div>
  <div
    class="flex-grow overflow-y-auto pt-2"
    bind:this={scrollableElement}
    onscroll={handleScroll}
  >
    <div class="w-full max-w-4xl mx-auto">
      {#each messageIds as messageId (messageId)}
        <ChatAppMessage {messageId} {data} />
      {/each}
    </div>
  </div>
  <div class="min-h-min">
    <section class="max-w-4xl mx-auto py-2 px-2">
      <SendMessageForm
        onSend={sendMsg}
        onStop={stopMsg}
        status={formStatus}
        threadId={data.threadId}
        maxLines={10}
      />
    </section>
  </div>
</div>
