<script lang="ts">
  import AppTree from "@shared/spaces/AppTree";
  import SendMessageForm from "../forms/SendMessageForm.svelte";
  import type { TreeVertex } from "@shared/replicatedTree/TreeVertex";
  import type { VertexChangeEvent } from "@shared/replicatedTree/treeTypes";
  import ChatAppMessage from "./ChatAppMessage.svelte";
  import { tick } from "svelte";
    import type { VertexOperation } from "@shared/replicatedTree/operations";

  const mainScrollableId = "chat-messanges-scrollable";

  let scrollableElement = $state<HTMLElement | undefined>(undefined);

  let { appTree }: { appTree: AppTree } = $props();

  let messagesVertex: TreeVertex | undefined = $state();
  let firstMessageId: string | undefined = $state();
  let lastMessageId: string | undefined = $state();
  let title: string | undefined = $state();

  let stickToBottomWhenLastMessageChanges = $state(false);

  $effect.pre(() => {
    title = appTree.tree.getVertexProperty(appTree.tree.rootVertexId, "title")
      ?.value as string;

    messagesVertex = appTree.tree.getVertexByPath("messages");
    if (!messagesVertex) {
      const newVertex = appTree.tree.newVertex(appTree.tree.rootVertexId);
      appTree.tree.setVertexProperty(newVertex, "_n", "messages");

      messagesVertex = appTree.tree.getVertex(newVertex);
    } else {
      const child = appTree.tree.getChildren(messagesVertex.id)[0];
      firstMessageId = child ? child.id : undefined;
      lastMessageId = getLastMessageId();
    }

    if (!messagesVertex) {
      throw new Error("messagesVertex should be defined");
    }

    appTree.tree.subscribe(messagesVertex.id, onVertexChange);
    appTree.tree.subscribe(appTree.tree.rootVertexId, onAppVertexChange);
    appTree.tree.subscribeToOpApplied(onOpApplied);

    return () => {
      if (messagesVertex) {
        appTree.tree.unsubscribe(messagesVertex.id, onVertexChange);
        appTree.tree.unsubscribe(appTree.tree.rootVertexId, onAppVertexChange);
        appTree.tree.unsubscribeFromOpApplied(onOpApplied);
      }
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

  function getLastMessageId(): string | undefined {
    if (!messagesVertex || messagesVertex.children.length === 0) {
      return undefined;
    }

    let lastMessageId: string = messagesVertex.children[0];

    while (true) {
      const children = appTree.tree.getChildren(lastMessageId);
      if (children.length === 0) {
        return lastMessageId;
      }
      lastMessageId = children[0].id;
    }
  }

  async function sendMsg(query: string) {
    if (!messagesVertex) {
      throw new Error("messagesVertex not found");
    }

    lastMessageId = getLastMessageId();

    const isFirstMessage = !lastMessageId;
    const parentId = lastMessageId ?? messagesVertex.id;
    const newMessageVertex = appTree.tree.newVertex(parentId);
    
    appTree.tree.setVertexProperty(newMessageVertex, "_n", "message");
    appTree.tree.setVertexProperty(newMessageVertex, "createdAt", Date.now());
    appTree.tree.setVertexProperty(newMessageVertex, "text", query);
    appTree.tree.setVertexProperty(newMessageVertex, "role", "user");

    if (isFirstMessage) {
      firstMessageId = newMessageVertex;
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
      {#if firstMessageId}
        <ChatAppMessage id={firstMessageId} tree={appTree.tree} />
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
