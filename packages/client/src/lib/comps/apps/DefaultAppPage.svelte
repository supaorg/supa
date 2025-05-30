<script lang="ts">
  import CenteredPage from "../basic/CenteredPage.svelte";
  import NewThread from "./NewThread.svelte";
</script>

<div class="flex flex-col h-full w-full items-center justify-center">
  <CenteredPage>
    <NewThread onSend={() => {}} />
  </CenteredPage>
</div>
