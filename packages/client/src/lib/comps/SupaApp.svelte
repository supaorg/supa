<script>
  //import SpaceEntry from "./SpaceEntry.svelte";
  import { isTauri } from "@client/tauri/isTauri";
  import { clientState } from "@client/state/clientState.svelte";

  console.log(isTauri, isTauri());

  console.log(clientState, clientState.isInitializing);
</script>

<!-- <SpaceEntry /> -->