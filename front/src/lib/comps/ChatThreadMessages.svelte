<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { v4 as uuidv4 } from "uuid";
  import { tick } from "svelte";
  import type { ThreadMessage as Message } from "@shared/models";
  import { client } from "$lib/tools/client";
  import { goto } from "$app/navigation";
  import SendMessageForm from "./forms/SendMessageForm.svelte";
  import ThreadMessage from "./ThreadMessage.svelte";
  import { routes } from "@shared/routes/routes";

  export let threadId: string;

  let prevThreadId = threadId;
  let chatWrapperElement: HTMLElement;
  let canSendMessage = false;
  let messages: Message[] = [];

  $: {
    if (prevThreadId !== threadId) {
      fetchThreadMessages();

      client.unlisten(`threads/${prevThreadId}`);

      client.listen(routes.thread(threadId), (broadcast) => {
        if (broadcast.action === "POST" || broadcast.action === "UPDATE") {
          onPostOrUpdateChatMsg(broadcast.data as Message);
        }
        if (broadcast.action === "DELETE") {
          onDeleteChatMsg(broadcast.data as Message);
        }

        scrollToBottom();
      });
    }

    prevThreadId = threadId;

    canSendMessage = checkIfCanSendMessage();
  }

  function checkIfCanSendMessage(): boolean {
    if (messages.length === 0) {
      return true;
    }

    const lastMessage = messages[messages.length - 1];

    const lastMessageIsByUser = lastMessage.role === "user";
    if (lastMessageIsByUser) {
      //console.log("Last message is by user, wait for the answer");
      return false;
    }

    const lastMessageIsInProgress = lastMessage.inProgress;
    if (lastMessageIsInProgress) {
      //console.log("Last message is in progress, wait for it to finish");
      return false;
    }

    const lastMessageIsError = lastMessage.role === "error";
    if (lastMessageIsError) {
      //console.log("Last message is an error, wait for it to be resolved");
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

    if (!canSendMessage) {
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
    } as Message;

    client.post(routes.thread(threadId), msg);

    messages.push(msg);
    messages = [...messages];

    query = "";
    scrollToBottom();
  }

  function onPostOrUpdateChatMsg(message: Message) {
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

  function onDeleteChatMsg(message: Message) {
    const index = messages.findIndex((m) => m.id === message.id);
    if (index !== -1) {
      messages.splice(index, 1);
      messages = [...messages];
    }
  }

  async function fetchThreadMessages() {
    messages = [];

    messages = await client.get(routes.thread(threadId)).then((res) => {
      if (res.error) {
        console.error(res.error);
        goto("/");
        return [];
      }

      const messages = res.data as Message[];
      return messages;
    });

    scrollToBottom();
  }

  onMount(async () => {
    await fetchThreadMessages();
  });

  onDestroy(async () => {
    if (threadId) {
      client.unlisten(routes.thread(threadId));
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
</script>

<div class="flex h-full flex-col max-w-3xl mx-auto justify-center items-center">
  <div class="flex-1 w-full overflow-hidden">
    <section
      class="overflow-y-auto space-y-4 pb-4 p-4"
      bind:this={chatWrapperElement}
    >
      {#each messages as message}
        <ThreadMessage {message} {threadId} />
      {/each}
    </section>
  </div>
  <div class="w-full max-w-3xl mx-auto sticky inset-x-0 bottom-0 page-bg">
    <section class="p-2 pt-2">
      <SendMessageForm onSend={sendMsg} disabled={!canSendMessage} />
    </section>
  </div>
</div>
