<script lang="ts">
  import AppTree from "@shared/spaces/AppTree";
  import SendMessageForm from "../forms/SendMessageForm.svelte";
  import { Vertex } from "@shared/replicatedTree/Vertex";
  import type { VertexChangeEvent } from "@shared/replicatedTree/treeTypes";
  import ChatAppMessage from "./ChatAppMessage.svelte";
  import { onMount, tick } from "svelte";
  import type { VertexOperation } from "@shared/replicatedTree/operations";

  const mainScrollableId = "chat-messanges-scrollable";

  let scrollableElement = $state<HTMLElement | undefined>(undefined);

  let { appTree }: { appTree: AppTree } = $props();

  let messagesContainerVertex: Vertex | undefined = $state();
  let firstMessageVertex: Vertex | undefined = $state();
  let lastMessageVertex: Vertex | undefined = $state();
  let title: string | undefined = $state();

  let stickToBottomWhenLastMessageChanges = $state(false);

  //$effect.pre(() => {
  onMount(() => {
    console.log("ChatApp.svelte");

    title = appTree.tree.getVertexProperty(appTree.tree.rootVertexId, "title")
      ?.value as string;

    messagesContainerVertex = appTree.tree.getVertexByPath("messages");
    if (!messagesContainerVertex) {
      messagesContainerVertex = appTree.tree.newVertex(
        appTree.tree.rootVertexId,
      );
      messagesContainerVertex.setProperty("_n", "messages");
    } else {
      const child = appTree.tree.getChildren(messagesContainerVertex.id)[0];
      firstMessageVertex = child ? child : undefined;
      lastMessageVertex = getLastMessageVertex();
    }

    if (!messagesContainerVertex) {
      throw new Error("messagesVertex should be defined");
    }

    const unobserveVertex = appTree.tree.observe(
      messagesContainerVertex.id,
      onVertexChange,
    );
    const unobserveAppVertex = appTree.tree.observe(
      appTree.tree.rootVertexId,
      onAppVertexChange,
    );
    const unobserveOpApplied = appTree.tree.observeOpApplied(onOpApplied);

    return () => {
      unobserveVertex();
      unobserveAppVertex();
      unobserveOpApplied();
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

  function onOpApplied(op: VertexOperation) {
    scrollToBottom();
  }

  function onAppVertexChange(event: VertexChangeEvent) {
    if (event.type === "property") {
      title = appTree.tree.getVertexProperty(appTree.tree.rootVertexId, "title")
        ?.value as string;
    }
  }

  function onVertexChange(event: VertexChangeEvent) {
    if (event.type === "children") {
      console.log("add or remove a child, ", event.vertexId);
    }
  }

  function getLastMessageVertex(): Vertex | undefined {
    if (
      !messagesContainerVertex ||
      messagesContainerVertex.children.length === 0
    ) {
      return undefined;
    }

    let lastMessageVertex: Vertex = messagesContainerVertex.children[0];

    while (true) {
      const children = appTree.tree.getChildren(lastMessageVertex.id);
      if (children.length === 0) {
        return lastMessageVertex;
      }
      lastMessageVertex = children[0];
    }
  }

  async function sendMsg(query: string) {
    if (!messagesContainerVertex) {
      throw new Error("messagesVertex not found");
    }

    lastMessageVertex = getLastMessageVertex();

    const isFirstMessage = !lastMessageVertex;
    const parentId = lastMessageVertex
      ? lastMessageVertex.id
      : messagesContainerVertex.id;
    const newMessageVertex = appTree.tree.newVertex(parentId);

    newMessageVertex.setProperties({
      _n: "message",
      createdAt: Date.now(),
      text: query,
      role: "user",
    });

    if (isFirstMessage) {
      firstMessageVertex = newMessageVertex;
    }

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
      <!--
      <AppConfigDropdown {threadId} />
      -->
      <h3 class="text-lg">{title ? title : "New thread"}</h3>
    </div>
  </div>
  <div
    class="flex-grow overflow-y-auto pt-2"
    bind:this={scrollableElement}
    id={mainScrollableId}
  >
    <div class="w-full max-w-3xl mx-auto px-4">
      {#if firstMessageVertex}
        <ChatAppMessage id={firstMessageVertex.id} tree={appTree.tree} />
      {/if}
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
