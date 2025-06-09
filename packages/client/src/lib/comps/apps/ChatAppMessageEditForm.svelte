<script lang="ts">
  import { onMount } from "svelte";

  export let initialValue: string = "";
  export let onSave: (text: string) => void;
  export let onCancel: () => void;

  let text = initialValue;
  let textareaEl: HTMLTextAreaElement;

  function adjustTextareaHeight() {
    if (!textareaEl) return;
    textareaEl.style.height = "auto";
    textareaEl.style.overflowY = "hidden";
    textareaEl.style.height = `${textareaEl.scrollHeight}px`;
  }

  function handleInput() {
    adjustTextareaHeight();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSave(text);
    }
  }

  onMount(() => {
    adjustTextareaHeight();
    textareaEl.focus();
    textareaEl.selectionStart = textareaEl.selectionEnd = text.length;
  });
</script>

<div class="w-[400px] flex flex-col p-3 rounded-lg preset-tonal">
  <textarea
    bind:this={textareaEl}
    bind:value={text}
    rows="2"
    class="w-full resize-none border-0 bg-transparent p-2 leading-normal outline-none focus:ring-0"
    oninput={handleInput}
    onkeydown={handleKeydown}
  ></textarea>
  <div class="flex gap-2 mt-2 justify-end">
    <button type="button" class="btn preset-outline" onclick={onCancel}>
      Cancel
    </button>
    <button type="button" class="btn" onclick={() => onSave(text)} disabled={text.trim().length === 0}>
      Send
    </button>
  </div>
</div>
