<script lang="ts">
  import { goto } from "$app/navigation";
  import type { AgentConfig, ThreadMessage } from "@shared/models";
  import SendMessageForm from "../forms/SendMessageForm.svelte";
  import { client } from "$lib/tools/client";
  import { v4 as uuidv4 } from "uuid";
  import { getModalStore } from "@skeletonlabs/skeleton";
  import { createThread } from "$lib/stores/threadStore";
  import { agentConfigStore } from "$lib/stores/agentStore";
  import { routes } from "@shared/routes/routes";

  const modalStore = getModalStore();

  const agentId = $modalStore[0].meta.agentId as string;
  let agent: AgentConfig | undefined;
  let placeholder = "Write a message...";

  $: {
    let targetAgent: AgentConfig | undefined;

    for (const agent of $agentConfigStore) {
      if (agent.id === agentId) {
        targetAgent = agent;
        break;
      }
    }

    if (targetAgent) {
      placeholder = targetAgent.button;
    }

    agent = targetAgent;

    console.log(agent);
  }

  let isSending = false;

  function onSend(msg: string) {
    if (!msg) {
      return;
    }

    newThread(msg);
  }

  async function newThread(message: string = "") {
    isSending = true;

    const newThread = await createThread(agentId);

    const msg = {
      id: uuidv4(),
      chatThreadId: newThread.id,
      role: "user",
      text: message,
      inProgress: null,
      createdAt: Date.now(),
      updatedAt: null,
    } as ThreadMessage;

    // Post and don't wait for the response, just go to the new thread
    // to see it live
    client.post(routes.threadMessages(newThread.id), msg);

    goto(`/?t=${newThread.id}`);

    isSending = false;

    modalStore.close();
  }
</script>

<div
  class="modal block overflow-y-auto bg-surface-100-800-token w-modal h-auto p-4 space-y-4 rounded-container-token shadow-xl"
>
  {#if isSending}
    <div>Loading...</div>
  {:else}
    {#if agent}
      <h3 class="h3">{agent.name}</h3>
    {/if}
    <SendMessageForm {onSend} {placeholder} />
  {/if}
</div>
