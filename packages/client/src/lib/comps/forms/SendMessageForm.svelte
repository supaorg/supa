<script lang="ts">
  import { Send, StopCircle, Paperclip } from "lucide-svelte";
  import AppConfigDropdown from "$lib/comps/apps/AppConfigDropdown.svelte";
  import { onMount, tick } from "svelte";
  import { focusTrap } from "$lib/utils/focusTrap";
  import { type MessageFormStatus } from "./messageFormStatus";
  import { txtStore } from "$lib/stores/txtStore";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import type { ChatAppData } from "@core/spaces/ChatAppData";
  import { swins } from "$lib/swins";

  const TEXTAREA_BASE_HEIGHT = 40; // px
  const TEXTAREA_LINE_HEIGHT = 1.5; // normal line height

  interface SendMessageFormProps {
    onSend: (msg: string) => void;
    onStop?: () => void;
    isFocused?: boolean;
    placeholder?: string;
    status?: MessageFormStatus;
    disabled?: boolean;
    draftId?: string;
    maxLines?: number;
    attachEnabled?: boolean;
    data?: ChatAppData; // Optional chat data for active chats
    showConfigSelector?: boolean;
  }

  let {
    onSend,
    onStop = () => {},
    isFocused = true,
    placeholder = $txtStore.messageForm.placeholder,
    status = "can-send-message",
    disabled = false,
    draftId,
    maxLines = Infinity,
    attachEnabled = false,
    data = undefined,
    showConfigSelector = true,
  }: SendMessageFormProps = $props();

  function openModelProvidersSettings() {
    swins.open("model-providers", {}, "Model Providers");
  }

  let query = $state("");
  let isTextareaFocused = $state(false);
  let textareaElement: HTMLTextAreaElement;

  let canSendMessage = $derived(
    !disabled && status === "can-send-message" && query.trim().length > 0,
  );

  let configId = $state("");

  function handleConfigChange(id: string) {
    if (data) {
      data.configId = id;
    }
  }

  onMount(() => {
    if (data && data.configId) {
      configId = data.configId;
    }

    loadDraft();

    if (isFocused) {
      textareaElement?.focus();
    }

    const observeData = data?.observe((d) => {
      const configIdFromData = d.configId;
      if (configIdFromData !== configId) {
        configId = configIdFromData as string;
      }
    });

    return () => {
      observeData?.();
    };
  });

  async function loadDraft() {
    if (!draftId) {
      return;
    }

    const draftContent = await spaceStore.getDraft(draftId);
    if (draftContent) {
      query = draftContent;
      // Adjust height after loading draft content into the textarea
      await tick();
      adjustTextareaHeight();
    }
  }

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

  async function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      await sendMsg();
      event.preventDefault();
      return;
    }
    adjustTextareaHeight();
  }

  async function handleInput() {
    adjustTextareaHeight();

    // Save or clear draft based on content
    if (draftId) {
      if (query) {
        await spaceStore.saveDraft(draftId, query);
      } else {
        await spaceStore.deleteDraft(draftId);
      }
    }
  }

  async function sendMsg() {
    if (disabled || status !== "can-send-message") {
      return;
    }

    onSend(query);

    // Clear draft when message is sent
    if (draftId) {
      await spaceStore.deleteDraft(draftId);
    }

    query = "";
    // Force reset to base height after clearing content
    if (textareaElement) {
      textareaElement.style.height = `${TEXTAREA_BASE_HEIGHT}px`;
      textareaElement.style.overflowY = "hidden"; // Reset overflow to prevent scrollbars

      await tick();
      adjustTextareaHeight();
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

{#if spaceStore.setupModelProviders}
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
          {disabled}
        ></textarea>

        <!-- Bottom toolbar -->
        <div class="flex items-center justify-between p-2 text-sm">
          <div class="flex items-center gap-2">
            {#if showConfigSelector}
              <AppConfigDropdown {configId} onChange={handleConfigChange} />
            {/if}
            {#if attachEnabled}
              <button
                class="flex items-center justify-center h-9 w-9 p-0"
                aria-label={$txtStore.messageForm.attachFile}
                {disabled}
              >
                <Paperclip size={20} />
              </button>
            {/if}
          </div>
          <div class="flex items-center gap-2">
            {#if status === "ai-message-in-progress"}
              <button
                onclick={stopMsg}
                class="flex items-center justify-center h-9 w-9 p-0"
                aria-label={$txtStore.messageForm.stop}
              >
                <StopCircle size={20} />
              </button>
            {:else}
              <button
                onclick={sendMsg}
                class="flex items-center justify-center h-9 w-9 p-0"
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
{:else}
  <div
    class="relative flex w-full flex-col items-center justify-center rounded-lg bg-surface-50-950 p-4 transition-colors ring ring-surface-300-700"
  >
    <p class="mb-4 text-center">
      Set up a model provider to chat with AI.
    </p>
    <button class="btn preset-filled" onclick={openModelProvidersSettings}>
      Setup brains
    </button>
  </div>
{/if}
