<script lang="ts">
  import { Send, StopCircle, Paperclip } from "lucide-svelte";
  import { onMount } from "svelte";
  import { focusTrap } from "$lib/utils/focusTrap";
  import { type MessageFormStatus } from "./messageFormStatus";
  import { txtStore } from "$lib/stores/txtStore";
  import { draftMessages } from "$lib/stores/draftMessages";
  import type { Writable } from "svelte/store";

  const TEXTAREA_BASE_HEIGHT = 40; // px
  const TEXTAREA_LINE_HEIGHT = 1.5; // normal line height

  interface SendMessageFormProps {
    onSend: (msg: string) => void;
    onStop?: () => void;
    onClose?: () => void;
    isFocused?: boolean;
    placeholder?: string;
    status?: MessageFormStatus;
    disabled?: boolean;
    threadId?: string;
    draftStore?: Writable<Record<string, string>>;
    maxLines?: number;
    attachEnabled?: boolean;
  }

  let {
    onSend,
    onStop = () => {},
    onClose = () => {},
    isFocused = true,
    placeholder = $txtStore.messageForm.placeholder,
    status = "can-send-message",
    disabled = false,
    threadId,
    draftStore = draftMessages,
    maxLines = Infinity,
    attachEnabled = false,
  }: SendMessageFormProps = $props();

  let query = $state("");
  let isTextareaFocused = $state(false);
  let textareaElement: HTMLTextAreaElement;

  // Load draft message if exists
  onMount(() => {
    if (threadId && $draftStore[threadId]) {
      query = $draftStore[threadId];
      // Adjust height after loading draft content
      setTimeout(() => adjustTextareaHeight(), 0);
    }

    if (isFocused) {
      textareaElement?.focus();
    }

    // Clean up draft when component is destroyed
    return () => {
      if (threadId && query) {
        draftStore.update(drafts => {
          drafts[threadId] = query;
          return drafts;
        });
      }
      onClose();
    };
  });

  function adjustTextareaHeight() {
    if (!textareaElement) return;
    
    // Reset height to initial value to allow proper scrollHeight calculation
    textareaElement.style.height = `${TEXTAREA_BASE_HEIGHT}px`;
    
    // Get the scroll height which represents the height needed to show all content
    const scrollHeight = textareaElement.scrollHeight;
    
    // Only expand if content needs more space
    if (scrollHeight > TEXTAREA_BASE_HEIGHT) {
      const lineHeight = TEXTAREA_LINE_HEIGHT * 16; // assuming 16px font size
      const maxHeight = maxLines * lineHeight;
      textareaElement.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      sendMsg();
      event.preventDefault();
      return;
    }
    adjustTextareaHeight();
  }

  function handleInput() {
    adjustTextareaHeight();
    
    // Save or clear draft based on content
    if (threadId) {
      draftStore.update(drafts => {
        if (query) {
          drafts[threadId] = query;
        } else {
          delete drafts[threadId];
        }
        return drafts;
      });
    }
  }

  async function sendMsg() {
    if (disabled || status !== "can-send-message") {
      return;
    }

    onSend(query);

    // Clear draft when message is sent
    if (threadId) {
      draftStore.update(drafts => {
        delete drafts[threadId];
        return drafts;
      });
    }

    query = "";
    adjustTextareaHeight();
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
        class="block w-full resize-none border-0 bg-transparent p-2 text-token-text-primary leading-normal placeholder:opacity-80 outline-none focus:ring-0"
        style="height: {TEXTAREA_BASE_HEIGHT}px; overflow-y: auto;"
        placeholder={placeholder}
        bind:value={query}
        onkeydown={handleKeydown}
        oninput={handleInput}
        onfocus={() => (isTextareaFocused = true)}
        onblur={() => (isTextareaFocused = false)}
      ></textarea>

      <!-- Bottom toolbar -->
      <div class="flex items-center justify-between p-2">
        <button
          class="flex items-center justify-center rounded-lg text-token-text-primary"
          class:opacity-50={!attachEnabled}
          disabled={!attachEnabled}
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
