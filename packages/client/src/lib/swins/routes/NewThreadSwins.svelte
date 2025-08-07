<script lang="ts">
  import type { AppConfig } from "@sila/core";
  import { clientState } from "@sila/client/state/clientState.svelte";
  import NewThread from "@sila/client/comps/apps/NewThread.svelte";

  let { appConfig }: { appConfig?: AppConfig } = $props();

  function onSend() {
    clientState.layout.swins.clear();
  }
</script>

<NewThread {appConfig} {onSend} />
