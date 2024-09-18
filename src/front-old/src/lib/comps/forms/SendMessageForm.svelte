<script lang="ts">
  import { Icon, PaperAirplane, Stop } from "svelte-hero-icons";
  import { focusTrap } from "@skeletonlabs/skeleton";
  import {
    THREAD_STATUS,
    type ThreadStatus,
  } from "$lib/stores/threadMessagesStore";

  export let onSend: (msg: string) => void;
  export let onStop: () => void = () => {};
  export let onHeightChange: (height: number) => void = () => {};
  export let isFocused = true;
  export let placeholder = "Write a message...";
  export let threadStatus: ThreadStatus = THREAD_STATUS.CAN_SEND_MESSAGE;
  export let disabled = false;

  let query = "";

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

<form use:focusTrap={isFocused}>
  <div
    class="input-group flex input-group-divider grid-cols-2 rounded-container-token p-2"
  >
    <textarea
      bind:value={query}
      data-focusindex="0"
      class="chat-textarea bg-transparent resize-none border-0 ring-0 flex-grow max-h-[200px]"
      name="prompt"
      id="prompt"
      {placeholder}
      rows="1"
      on:keydown={handleKeydownInChatInput}
      on:keyup={handleKeyupInChatInput}
    />
    {#if threadStatus === THREAD_STATUS.AI_MESSAGE_IN_PROGRESS}
      <button
        class={`btn btn-sm h-10 variant-filled-primary`}
        data-focusindex="1"
        on:click={stopMsg}
      >
        <Icon src={Stop} mini class="w-4 h-4" />
      </button>
    {:else}
      <button
        class={`btn btn-sm h-10 ${query ? "variant-filled-primary" : "input-group-shim"}`}
        data-focusindex="1"
        on:click={sendMsg}
        disabled={disabled || threadStatus !== THREAD_STATUS.CAN_SEND_MESSAGE}
      >
        <Icon src={PaperAirplane} mini class="w-4 h-4" />
      </button>
    {/if}
  </div>
</form>
