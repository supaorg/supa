<script lang="ts">
  import type { AppConfig } from "@core/models";
  import { swins } from "../swinsLayout";
  import NewThread from "$lib/comps/apps/NewThread.svelte";

  let { appConfig }: { appConfig?: AppConfig } = $props();

  function onSend() {
    swins.clear();
  }
</script>

<NewThread {appConfig} {onSend} />
