<script lang="ts">
  import AppTree from "@shared/spaces/AppTree";
  import SendMessageForm from "../forms/SendMessageForm.svelte";

  let { appTree }: { appTree: AppTree } = $props();

  let treeIdTest = "";

  $effect(() => { 
    console.log("appTree", appTree.getId());

    treeIdTest = appTree.getId();

    return () => {
      console.log("unmount appTree", appTree.getId());
    };
  });


  let messagesVertex = $derived.by(() => { 
    let messagesVertex = appTree.tree.getVertexByPath("/app-tree/messages");

    if (messagesVertex) {
      return messagesVertex;
    }

    const newVertex = appTree.tree.newVertex(appTree.tree.rootVertexId);
    appTree.tree.setVertexProperty(newVertex, "_n", "messages");

    messagesVertex = appTree.tree.getVertex(newVertex);

    if (!messagesVertex) {
      throw new Error("messagesVertex not found");
    }

    return messagesVertex;    
  });

  let firstMessageId = $derived.by(() => {
    const child = appTree.tree.getChildren(messagesVertex.id)[0];
    if (!child) {
      return null;
    }
    return child.id;
  });

  /*

  $effect(() => {
    console.log("appTree", appTree);

    const messagesVertex = appTree.tree.getVertexByPath("/app-tree/messages");
    if (!messagesVertex) {
      const newVertex = appTree.tree.newVertex(appTree.tree.rootVertexId);
      appTree.tree.setVertexProperty(newVertex, "_n", "messages");
    }
  });

  let messagesVertex = $derived(appTree.tree.getVertexByPath("/app-tree/messages"));

  $effect(() => {
    if (messagesVertex) {
      console.log("subscribing to messagesVertex", messagesVertex.id);
      appTree.tree.subscribe(messagesVertex.id, (event) => {
        if (event.type === "children") {
          console.log("add or remove a child, ", event.vertexId);
        }
      });
    }
  });

  let messages = $derived.by(() => {
    if (!messagesVertex) {
      return [];
    }
    return appTree.tree.getChildren(messagesVertex.id);
  });

  $effect(() => {
    console.log("messages", messages);
  });
  */

  async function sendMsg(query: string) {
    console.log("sendMsg", query);
    console.log("messagesVertex", messagesVertex);

    const newMessageVertex = appTree.tree.newVertex(messagesVertex.id);
    appTree.tree.setVertexProperty(newMessageVertex, "_n", "message");
    appTree.tree.setVertexProperty(newMessageVertex, "role", "user");
    appTree.tree.setVertexProperty(newMessageVertex, "text", query);

    console.log("newMessageVertex", newMessageVertex);
    

    /*
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
    */
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
      <h3 class="text-lg">{appTree.getId()}</h3>
    </div>
  </div>
  <div class="flex-grow overflow-y-auto pt-2" id="chat-messanges-scrollable">
    Messages
    Root: {messagesVertex}
    First: {firstMessageId}
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
