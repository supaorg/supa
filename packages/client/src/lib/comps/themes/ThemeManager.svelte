<script lang="ts">
  import { clientState } from "$lib/state/clientState.svelte";
  import { applyColorSchemeToDocument } from "$lib/utils/updateColorScheme";
    import { onMount } from "svelte";

  function applyThemeToDocument(themeName: string) {
    document.documentElement.setAttribute("data-theme", themeName);
  }

  onMount(() => {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      applyColorSchemeToDocument(clientState.theme.colorScheme);
    });
  });

  $effect(() => {
    applyThemeToDocument(clientState.theme.themeName);
  });

  $effect(() => {
    applyColorSchemeToDocument(clientState.theme.colorScheme);
  });
</script>
