<script lang="ts">
  import { Send, StopCircle, Paperclip } from "lucide-svelte";
  import { onMount } from "svelte";
  import { focusTrap } from "$lib/utils/focusTrap";
  import { type MessageFormStatus } from "./messageFormStatus";
  import { txtStore } from "$lib/stores/txtStore";

  interface SendMessageFormProps {
    onSend: (msg: string) => void;
    onStop?: () => void;
    onHeightChange?: (height: number) => void;
    isFocused?: boolean;
    placeholder?: string;
    status?: MessageFormStatus;
    disabled?: boolean;
  }

  let {
    onSend,
    onStop = () => {},
    onHeightChange = () => {},
    isFocused = true,
    placeholder = $txtStore.messageForm.placeholder,
    status = "can-send-message",
    disabled = false,
  }: SendMessageFormProps = $props();

  let query = $state("");
  let isTextareaFocused = $state(false);
  let textareaElement: HTMLTextAreaElement;

  onMount(() => {
    if (isFocused) {
      textareaElement?.focus();
    }
  });

  function adjustTextareaHeight(textarea: HTMLTextAreaElement) {
    textarea.style.height = "1px"; // Temporarily shrink to get accurate scrollHeight
    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = scrollHeight + "px";

    onHeightChange(scrollHeight);
  }

  function handleKeydownInChatInput(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      sendMsg();
      event.preventDefault();
    }

    const textarea = event.target as HTMLTextAreaElement;

    adjustTextareaHeight(textarea);
  }

  function handleKeyupInChatInput(event: KeyboardEvent) {
    const textarea = event.target as HTMLTextAreaElement;

    adjustTextareaHeight(textarea);
  }

  async function sendMsg() {
    if (disabled || status !== "can-send-message") {
      return;
    }

    onSend(query);

    query = "";
  }

  async function stopMsg() {
    if (status !== "ai-message-in-progress") {
      return;
    }

    onStop();
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
  }
</script>

<form class="w-full" use:focusTrap={isFocused} onsubmit={handleSubmit}>
  <div class="relative flex w-full items-center">
    <div
      class="flex w-full flex-col rounded-lg bg-surface-900 transition-colors"
      class:ring={isTextareaFocused}
      class:ring-primary-300-700={isTextareaFocused}
    >
      <textarea
        bind:this={textareaElement}
        class="block h-10 w-full resize-none border-0 bg-transparent p-2 text-token-text-primary placeholder:opacity-80 outline-none focus:ring-0"
        {placeholder}
        bind:value={query}
        onkeydown={handleKeydownInChatInput}
        onkeyup={handleKeyupInChatInput}
        onfocus={() => (isTextareaFocused = true)}
        onblur={() => (isTextareaFocused = false)}
      ></textarea>

      <!-- Bottom toolbar -->
      <div class="flex items-center justify-between p-2">
        <button
          class="flex items-center justify-center rounded-lg text-token-text-primary"
          aria-label={$txtStore.messageForm.attachFile}
        >
          <Paperclip size={18} />
        </button>

        <div class="relative">
          {#if status === "ai-message-in-progress"}
            <button
              onclick={stopMsg}
              class="flex items-center justify-center rounded-full hover:bg-surface-700"
              aria-label={$txtStore.messageForm.stop}
            >
              <StopCircle size={18} />
            </button>
          {:else}
            <button
              onclick={sendMsg}
              class="flex items-center justify-center rounded-full hover:bg-surface-700"
              class:opacity-50={disabled ||
                status !== "can-send-message" ||
                query.length === 0}
              disabled={disabled ||
                status !== "can-send-message" ||
                query.length === 0}
              aria-label={$txtStore.messageForm.send}
            >
              <Send size={18} />
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
</form>
