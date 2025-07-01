<script lang="ts">
  import type { AppConfig } from "@core/models";
  import { clientState } from "$lib/clientState.svelte";
  import NewThread from "$lib/comps/apps/NewThread.svelte";

  let { appConfig }: { appConfig?: AppConfig } = $props();

  function onSend() {
    clientState.layout.swins.clear();
  }
</script>

<NewThread {appConfig} {onSend} />
