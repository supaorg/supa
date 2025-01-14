<script lang="ts">
  import MarkdownMessage from "../markdown/MarkdownMessage.svelte";
  import { User, Sparkles, CircleAlert } from "lucide-svelte";
  import type { ThreadMessage } from "@shared/models";
  import type { ChatAppData } from "@shared/spaces/ChatAppData";
  import { onMount } from "svelte";
  import MessageDate from "./MessageDate.svelte";

  let { messageId, data }: { messageId: string; data: ChatAppData } = $props();

  let message: ThreadMessage | undefined = $state();
  let canRetry = $state(false);
  let isLast = $state(false);

  onMount(() => {
    const unobserve = data.observeMessage(messageId, (msg) => {
      message = msg;
      isLast = data.isLastMessage(messageId);

      canRetry =
        isLast &&
        (msg.role === "error" ||
          (isMoreThanOneMinuteOld(msg.createdAt) &&
            data.isMessageInProgress(messageId)));
    });

    return () => {
      unobserve();
    };
  });

  function isMoreThanOneMinuteOld(dateInMs: number) {
    return dateInMs + 60000 < Date.now();
  }

  function replaceNewlinesWithHtmlBrs(text: string) {
    // Trim newlines at the start and end
    text = text.replace(/^\n+|\n+$/g, "");
    // Replace remaining newlines with <br />
    return text.replace(/\n/g, "<br />");
  }

  async function retry() {
    data.triggerEvent("retry-message", {
      messageId: messageId,
    });
  }
</script>

{#if message}
  <div class="flex gap-3 px-4 py-2">
    <div class="flex-shrink-0 mt-1">
      <div class="w-8 h-8 rounded-full flex items-center justify-center">
        {#if message.role === "user"}
          <User size={18} />
        {:else if message.role === "assistant"}
          <Sparkles size={18} />
        {:else}
          <CircleAlert size={18} />
        {/if}
      </div>
    </div>
    <div class="flex-1">
      <div class="flex items-center justify-between gap-2 mt-2">
        <div class="flex items-center gap-2">
          {#if message.role === "user"}
            <p class="font-bold">You</p>
          {:else if message.role === "assistant"}
            <p class="font-bold">AI</p>
          {:else}
            <p class="font-bold">Error</p>
          {/if}
        </div>
        {#if message.role === "user"}
          <MessageDate createdAt={message.createdAt} />
        {/if}
      </div>
      <div>
        {#if message.role === "user"}
          {@html message.text ? replaceNewlinesWithHtmlBrs(message.text) : ""}
        {:else}
          <MarkdownMessage
            source={message.text ? message.text : "Loading..."}
          />
        {/if}

        {#if canRetry}
          <button class="btn variant-filled" onclick={retry}>Retry</button>
        {/if}
      </div>
    </div>
  </div>
{/if}
