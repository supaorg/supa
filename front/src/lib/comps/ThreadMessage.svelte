<script lang="ts">
  import type { ThreadMessage } from "@shared/models";
  import { Icon, Sparkles, UserCircle } from "svelte-hero-icons";
  import Markdown from "@magidoc/plugin-svelte-marked";
  import MarkdownCode from "./markdown/MarkdownCode.svelte";
  import MarkdownLink from "./markdown/MarkdownLink.svelte";
  import { client } from "$lib/tools/client";

  export let message: ThreadMessage;
  export let threadId: string;

  let messageTakesTooLong = false;
  let retrying = false;
  
  let createdAt = new Date(message.createdAt);
  $: {
    createdAt = new Date(message.createdAt);
    messageTakesTooLong = message.role !== "user" && message.inProgress === 1 && createdAt.getTime() + 60000 < Date.now();
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
    await client.post(`threads/${threadId}/retry`);
  }
</script>

<div class="flex flex-1 text-base mx-auto gap-3">
  <div class="flex-shrink-0 flex flex-col relative items-end">
    <div
      class="gizmo-shadow-stroke flex h-6 w-6 items-center justify-center overflow-hidden"
    >
      {#if message.role === "user"}
        <Icon src={UserCircle} mini class="h-6 w-6" />
      {:else}
        <Icon src={Sparkles} mini class="h-6 w-6" />
      {/if}
    </div>
  </div>
  <div class="relative flex w-full flex-col">
    <header class="flex justify-between items-center">
      {#if message.role === "user"}
        <p class="font-bold">You</p>
        <small class="opacity-50">{formatChatDate(message.createdAt)}</small>
      {:else}
        <p class="font-bold">AI</p>
      {/if}
    </header>
    <div class="thread-message leading-relaxed">
      <Markdown
        source={message.text ? message.text : "Loading..."}
        renderers={{
          code: MarkdownCode,
          link: MarkdownLink,
        }}
      />
      {#if messageTakesTooLong && !retrying}
        <button class="btn variant-filled" on:click={retry}>Retry</button>
      {/if}
    </div>
    <div class="mt-1 flex justify-start gap-3 empty:hidden h-7">
      <div class="h-7"></div>
    </div>
  </div>
</div>
