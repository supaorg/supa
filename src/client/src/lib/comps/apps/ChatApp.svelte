<script lang="ts">
  import SendMessageForm from "../forms/SendMessageForm.svelte";
  import { Vertex } from "@shared/replicatedTree/Vertex";
  import type { VertexChangeEvent } from "@shared/replicatedTree/treeTypes";
  import ChatAppMessage from "./ChatAppMessage.svelte";
  import { onMount, tick } from "svelte";
  import type { VertexOperation } from "@shared/replicatedTree/operations";
  import AppConfigDropdown from "./AppConfigDropdown.svelte";
  import { ChatAppData } from "@shared/spaces/ChatAppData";
  import type { ThreadMessage } from "@shared/models";

  const mainScrollableId = "chat-messanges-scrollable";

  let scrollableElement = $state<HTMLElement | undefined>(undefined);

  let { data }: { data: ChatAppData } = $props();

  let title: string | undefined = $state();
  let messages = $state<ThreadMessage[]>([]);

  let stickToBottomWhenLastMessageChanges = $state(false);

  onMount(() => {
    const unobserve = data.observe((data) => {
      title = data.title as string;
    });

    const unobserveMessages = data.observeMessages((msgs) => {
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

  // @TODO: new message arrives
  function onOpApplied(op: VertexOperation) {
    scrollToBottom();
  }

  async function sendMsg(query: string) {
    data.newMessage({
      id: crypto.randomUUID(),
      role: "user",
      text: query,
      createdAt: Date.now(),
      inProgress: null,
      updatedAt: null,
    });

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
      <AppConfigDropdown {data} />
      <h3 class="text-lg">{title ? title : "New thread"}</h3>
    </div>
  </div>
  <div
    class="flex-grow overflow-y-auto pt-2"
    bind:this={scrollableElement}
    id={mainScrollableId}
  >
    <div class="w-full max-w-3xl mx-auto px-4">
      {#each messages as message (message.id)}
        <ChatAppMessage {message} {data} />
      {/each}
    </div>
    <!--
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
    -->
  </div>
  <div class="min-h-min">
    <section class="max-w-3xl mx-auto py-2 px-2">
      <SendMessageForm onSend={sendMsg} onStop={stopMsg} />
    </section>
  </div>
</div>
