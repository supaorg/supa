<script lang="ts">
  import type { ThreadMessage } from "@shared/models";
  import {
    ExclamationCircle,
    Icon,
    Sparkles,
    UserCircle,
  } from "svelte-hero-icons";
  import { client } from "$lib/tools/client";
  import { routes } from "@shared/routes/routes";
  import MarkdownMessage from "./markdown/MarkdownMessage.svelte";

  export let message: ThreadMessage;
  export let threadId: string;
  export let isLastInThread = false;

  let canRetry = false;
  let retrying = false;

  let createdAt = new Date(message.createdAt);
  $: {
    createdAt = new Date(message.createdAt);
    canRetry =
      isLastInThread &&
      ((message.role === "user" &&
        isMoreThanOneMinuteOld(createdAt.getTime())) ||
        (message.role === "assistant" &&
          message.inProgress === 1 &&
          isMoreThanOneMinuteOld(createdAt.getTime())) ||
        message.role === "error");
  }

  function isMoreThanOneMinuteOld(dateInMs: number) {
    return dateInMs + 60000 < Date.now();
  }

  function formatChatDate(dateInMs: number) {
    const date = new Date(dateInMs);
    return date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Use 24-hour format
    });
  }

  async function retry() {
    retrying = true;
    await client.post(routes.retryThread(threadId));
    retrying = false;
  }

  function replaceNewlinesWithHtmlBrs(text: string) {
    // Trim newlines at the start and end
    text = text.replace(/^\n+|\n+$/g, "");
    // Replace remaining newlines with <br />
    return text.replace(/\n/g, "<br />");
  }
</script>

<div class="flex flex-1 text-base mx-auto gap-3 w-full">
  <div class="flex-shrink-0 flex flex-col relative items-end">
    <div
      class="gizmo-shadow-stroke flex h-6 w-6 items-center justify-center overflow-hidden"
    >
      {#if message.role === "user"}
        <Icon src={UserCircle} mini class="h-6 w-6" />
      {:else if message.role === "assistant"}
        <Icon src={Sparkles} mini class="h-6 w-6" />
      {:else}
        <Icon src={ExclamationCircle} mini class="h-6 w-6" />
      {/if}
    </div>
  </div>
  <div class="relative flex w-full flex-col flex-grow">
    <header class="flex justify-between items-center">
      {#if message.role === "user"}
        <p class="font-bold">You</p>
        <small class="opacity-50">{formatChatDate(message.createdAt)}</small>
      {:else if message.role === "assistant"}
        <p class="font-bold">AI</p>
      {:else}
        <p class="font-bold">Error</p>
      {/if}
    </header>
    <div class="thread-message flex-grow leading-relaxed">
      {#if message.role === "user"}
        {@html message.text ? replaceNewlinesWithHtmlBrs(message.text) : ""}
      {:else}
        <MarkdownMessage source={message.text ? message.text : "Loading..."} />
      {/if}

      {#if canRetry && !retrying}
        <button class="btn variant-filled" on:click={retry}>Retry</button>
      {/if}
    </div>
    <div class="mt-1 flex justify-start gap-3 empty:hidden h-7">
      <div class="h-7"></div>
    </div>
  </div>
</div>
