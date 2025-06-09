<script lang="ts">
  import { onMount } from "svelte";

  onMount(() => {
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  });

  function handleContextMenu(event: MouseEvent) {
    if (import.meta.env.DEV) return;
    if (window === null) return;

    // Check if there's selected text
    const selectedText = window.getSelection()?.toString();

    // Check if the target is a form element that would benefit from context menu
    const isFormElement = (event.target as HTMLElement).matches(
      'input, textarea, select, [contenteditable="true"]',
    );

    // Allow context menu for text selections or form elements
    if (selectedText || isFormElement) {
      // Let the default context menu appear
      return;
    }

    // Otherwise prevent the default context menu
    event.preventDefault();

    // @TODO: detect if the element has a context menu and show it
  }
</script>
