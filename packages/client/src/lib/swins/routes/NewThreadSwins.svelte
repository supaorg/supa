<script lang="ts">
  import type { AppConfig } from "@core/models";
  import { clientState } from "@client/state/clientState.svelte";
  import NewThread from "@client/comps/apps/NewThread.svelte";

  let { appConfig }: { appConfig?: AppConfig } = $props();

  function onSend() {
    clientState.layout.swins.clear();
  }
</script>

<NewThread {appConfig} {onSend} />
