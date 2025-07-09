<script lang="ts">
  import { clientState } from "$lib/state/clientState.svelte";
  import { applyColorSchemeToDocument } from "$lib/utils/updateColorScheme";

  function applyThemeToDocument(themeName: string) {
    document.documentElement.setAttribute("data-theme", themeName);
  }

  $effect(() => {
    applyThemeToDocument(clientState.theme.themeName);
  });

  $effect(() => {
    applyColorSchemeToDocument(clientState.theme.colorScheme);
  });
</script>
