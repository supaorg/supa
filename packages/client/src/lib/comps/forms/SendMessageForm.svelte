<script lang="ts">
  import { Send, StopCircle, Paperclip } from "lucide-svelte";
  import AppConfigDropdown from "$lib/comps/apps/AppConfigDropdown.svelte";
  import { onMount } from "svelte";
  import { timeout } from "@core/tools/timeout";
  import { focusTrap } from "$lib/utils/focusTrap";
  import { type MessageFormStatus } from "./messageFormStatus";
  import { txtStore } from "$lib/stores/txtStore";
  import { draftMessages } from "$lib/stores/draftMessages";
  import type { Writable } from "svelte/store";

  const TEXTAREA_BASE_HEIGHT = 40; // px
  const TEXTAREA_LINE_HEIGHT = 1.5; // normal line height

  import type { ChatAppData } from "@core/spaces/ChatAppData";
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
    data?: ChatAppData; // Optional chat data for active chats
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
    data = undefined,
  }: SendMessageFormProps = $props();

  let query = $state("");
  let isTextareaFocused = $state(false);
  let textareaElement: HTMLTextAreaElement;

  let canSendMessage = $derived(
    !disabled && status === "can-send-message" && query.length > 0,
  );

  // Config dropdown state
  let configId = $state("");
  $effect(() => {
    if (data && data.configId) {
      configId = data.configId;
    }
  });

  function handleConfigChange(id: string) {
    if (data) {
      data.configId = id;
    } else {
      configId = id;
    }
  }

  // Load draft message if exists
  onMount(() => {
    if (threadId && $draftStore[threadId]) {
      query = $draftStore[threadId];
      // Adjust height after loading draft content
      timeout(() => adjustTextareaHeight(), 0);
    }

    if (isFocused) {
      textareaElement?.focus();
    }

    // Clean up draft when component is destroyed
    return () => {
      if (threadId && query) {
        draftStore.update((drafts) => {
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
    textareaElement.style.overflowY = "hidden";

    // Get the scroll height which represents the height needed to show all content
    const scrollHeight = textareaElement.scrollHeight;

    // Calculate the maximum height based on maxLines
    const lineHeight = TEXTAREA_LINE_HEIGHT * 16; // assuming 16px font size
    const maxHeight = maxLines * lineHeight;

    if (scrollHeight > TEXTAREA_BASE_HEIGHT) {
      // Set the height to either the scroll height or max height, whichever is smaller
      textareaElement.style.height = `${Math.min(scrollHeight, maxHeight)}px`;

      // Only show scrollbars if content exceeds max height
      if (scrollHeight > maxHeight) {
        textareaElement.style.overflowY = "auto";
      } else {
        textareaElement.style.overflowY = "hidden";
      }
    } else {
      // Set to base height and hide scrollbars if content is small
      textareaElement.style.height = `${TEXTAREA_BASE_HEIGHT}px`;
      textareaElement.style.overflowY = "hidden";
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
      draftStore.update((drafts) => {
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
      draftStore.update((drafts) => {
        delete drafts[threadId];
        return drafts;
      });
    }

    query = "";
    // Force reset to base height after clearing content
    if (textareaElement) {
      textareaElement.style.height = `${TEXTAREA_BASE_HEIGHT}px`;
      textareaElement.style.overflowY = "hidden"; // Reset overflow to prevent scrollbars
      // Use timeout to ensure UI updates before recalculating
      timeout(() => {
        adjustTextareaHeight();
      }, 0);
    }
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
      class="flex w-full flex-col rounded-lg bg-surface-50-950 transition-colors ring"
      class:ring-primary-300-700={isTextareaFocused}
      class:ring-surface-300-700={!isTextareaFocused}
    >
      <textarea
        bind:this={textareaElement}
        class="block w-full resize-none border-0 bg-transparent p-2 leading-normal outline-none focus:ring-0"
        style="height: {TEXTAREA_BASE_HEIGHT}px; overflow-y: hidden;"
        {placeholder}
        bind:value={query}
        onkeydown={handleKeydown}
        oninput={handleInput}
        onfocus={() => (isTextareaFocused = true)}
        onblur={() => (isTextareaFocused = false)}
      ></textarea>

      <!-- Bottom toolbar -->
      <div class="flex items-center justify-between p-2">
        <div class="flex items-center">
          <button
            class="flex items-center justify-center rounded-lg"
            class:opacity-50={!attachEnabled}
            disabled={!attachEnabled}
            aria-label={$txtStore.messageForm.attachFile}
          >
            <Paperclip size={20} />
          </button>
        </div>
        <div class="flex items-center gap-1">
          <AppConfigDropdown {configId} onChange={handleConfigChange} />
          {#if status === "ai-message-in-progress"}
            <button
              onclick={stopMsg}
              class="flex items-center justify-center"
              aria-label={$txtStore.messageForm.stop}
            >
              <StopCircle size={20} />
            </button>
          {:else}
            <button
              onclick={sendMsg}
              class="flex items-center justify-center"
              class:text-primary-500={canSendMessage}
              class:opacity-50={!canSendMessage}
              disabled={!canSendMessage}
              aria-label={$txtStore.messageForm.send}
            >
              <Send size={20} />
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
</form>
