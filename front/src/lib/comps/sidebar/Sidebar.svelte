<script lang="ts">
  import ThreadsInSidebar from "./ThreadsInSidebar.svelte";
  import { Icon, SquaresPlus } from "svelte-hero-icons";
  import AgentConfigs from "./AgentConfigs.svelte";
</script>

<div class="p-2">
  <AgentConfigs />
  <a href="/agents" class="sidebar-btn w-full flex">
    <span class="w-8 h-8 flex-shrink-0">
      <span class="relative flex h-full items-center justify-center">
        <Icon src={SquaresPlus} mini class="w-6" />
      </span>
    </span>
    <span class="flex-grow text-left">Agents</span>
  </a>
  <ThreadsInSidebar />
</div>
