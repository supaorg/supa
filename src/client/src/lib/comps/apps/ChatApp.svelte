<script lang="ts">
  import AppTree from "@shared/spaces/AppTree";
  import SendMessageForm from "../forms/SendMessageForm.svelte";
  
  let { appTree }: { appTree: AppTree } = $props();

  async function sendMsg(query: string) {
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
