<script lang="ts">
  import { Send, StopCircle, Paperclip } from "lucide-svelte";
  import { onMount } from 'svelte';
  import { focusTrap } from '$lib/utils/focusTrap';

  const THREAD_STATUS = {
    DISABLED: "disabled",
    CAN_SEND_MESSAGE: "can-send-message",
    SENDING: "sending",
    AI_MESSAGE_IN_PROGRESS: "ai-message-in-progress",
    ERROR: "error",
  } as const;

  type ThreadStatus = (typeof THREAD_STATUS)[keyof typeof THREAD_STATUS];

  interface SendMessageFormProps {
    onSend: (msg: string) => void;
    onStop?: () => void;
    onHeightChange?: (height: number) => void;
    isFocused?: boolean;
    placeholder?: string;
    threadStatus?: ThreadStatus;
    disabled?: boolean;
  }

  let {
    onSend,
    onStop = () => {},
    onHeightChange = () => {},
    isFocused = true,
    placeholder = "Write a message...",
    threadStatus = THREAD_STATUS.CAN_SEND_MESSAGE,
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
    if (disabled || threadStatus !== THREAD_STATUS.CAN_SEND_MESSAGE) {
      return;
    }

    onSend(query);

    query = "";
  }

  async function stopMsg() {
    if (threadStatus !== THREAD_STATUS.AI_MESSAGE_IN_PROGRESS) {
      return;
    }

    onStop();
  }
</script>

<form class="w-full" use:focusTrap={isFocused}>
  <div class="relative flex h-full max-w-full flex-1 flex-col">
    <div class="absolute bottom-full left-0 right-0 z-20"></div>
    <div class="group relative flex w-full items-center">
      <div class="w-full">
        <div class="flex w-full cursor-text flex-col rounded-lg px-2.5 py-1 transition-colors bg-surface-900" class:ring={isTextareaFocused} class:ring-primary-300-700={isTextareaFocused}>
          <div class="flex min-h-[44px] items-start pl-2">
            <div class="min-w-0 max-w-full flex-1">
              <div class="max-h-[25dvh] max-h-52 overflow-auto">
                <textarea
                  bind:this={textareaElement}
                  class="block h-10 w-full resize-none border-0 bg-transparent px-0 py-2 text-token-text-primary placeholder:opacity-80"
                  {placeholder}
                  bind:value={query}
                  onkeydown={handleKeydownInChatInput}
                  onkeyup={handleKeyupInChatInput}
                  onfocus={() => isTextareaFocused = true}
                  onblur={() => isTextareaFocused = false}
                ></textarea>
              </div>
            </div>
            <div class="w-[32px] pt-1"></div>
          </div>
          
          <!-- Bottom toolbar -->
          <div class="flex h-[44px] items-center justify-between">
            <div class="flex gap-x-1">
              <!-- Attach files button -->
              <button class="flex h-8 w-8 items-center justify-center rounded-lg text-token-text-primary">
                <Paperclip size={16} />
              </button>
            </div>
            
            <!-- Voice button -->
            <div class="min-w-8">
              <div class="relative h-8 w-8">
                {#if threadStatus === THREAD_STATUS.AI_MESSAGE_IN_PROGRESS}
                  <button 
                    onclick={stopMsg} 
                    class="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-700"
                  >
                    <StopCircle size={16} />
                  </button>
                {:else}
                  <button 
                    onclick={sendMsg} 
                    class="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-700" 
                    class:opacity-50={disabled || threadStatus !== THREAD_STATUS.CAN_SEND_MESSAGE}
                    disabled={disabled || threadStatus !== THREAD_STATUS.CAN_SEND_MESSAGE}
                  >
                    <Send size={16} />
                  </button>
                {/if}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</form>