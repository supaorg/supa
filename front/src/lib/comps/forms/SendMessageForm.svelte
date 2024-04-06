<script lang="ts">
  import { Icon, PaperAirplane } from "svelte-hero-icons";
  import { focusTrap } from "@skeletonlabs/skeleton";

  export let onSend: (msg: string) => void;
  export let onHeightChange: (height: number) => void = () => {};
  export let isFocused = true;
  export let placeholder = "Write a message...";

  let query = "";

  function adjustTextareaHight(textarea: HTMLTextAreaElement) {
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

    adjustTextareaHight(textarea);
  }

  function handleKeyupInChatInput(event: KeyboardEvent) {
    const textarea = event.target as HTMLTextAreaElement;

    adjustTextareaHight(textarea);
  }

  async function sendMsg() {
    onSend(query);

    query = "";
  }
</script>

<form use:focusTrap={isFocused}>
  <div
    class="input-group flex input-group-divider grid-cols-2 rounded-container-token p-2"
  >
    <textarea
      bind:value={query}
      data-focusindex="0"
      class="chat-textarea bg-transparent resize-none border-0 ring-0 flex-grow"
      name="prompt"
      id="prompt"
      {placeholder}
      rows="1"
      on:keydown={handleKeydownInChatInput}
      on:keyup={handleKeyupInChatInput}
    />
    <button
      class={`btn btn-sm h-10 ${query ? "variant-filled-primary" : "input-group-shim"}`}
      data-focusindex="1"
      on:click={sendMsg}
    >
      <Icon src={PaperAirplane} mini class="w-4 h-4" />
    </button>
  </div>
</form>
