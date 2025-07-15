<script lang="ts">
  import type { AppConfig } from "@supa/core";
  import { clientState } from "$lib/state/clientState.svelte";
  import NewThread from "$lib/comps/apps/NewThread.svelte";

  let { appConfig }: { appConfig?: AppConfig } = $props();

  function onSend() {
    clientState.layout.swins.clear();
  }
</script>

<NewThread {appConfig} {onSend} />
