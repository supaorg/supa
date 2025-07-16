<script lang="ts">
  import type { AppConfig } from "@supa/core";
  import { clientState } from "@supa/client/state/clientState.svelte";
  import NewThread from "@supa/client/comps/apps/NewThread.svelte";

  let { appConfig }: { appConfig?: AppConfig } = $props();

  function onSend() {
    clientState.layout.swins.clear();
  }
</script>

<NewThread {appConfig} {onSend} />
