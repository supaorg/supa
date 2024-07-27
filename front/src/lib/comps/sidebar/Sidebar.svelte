<script lang="ts">
  import ThreadsInSidebar from "./ThreadsInSidebar.svelte";
  import { Icon, SquaresPlus } from "svelte-hero-icons";
  import AgentConfigs from "./AgentConfigs.svelte";
</script>

<div class="flex flex-col h-screen">
  <div class="min-h-min px-2 pb-4">
    <AgentConfigs />
    <a href="/apps" class="sidebar-btn w-full flex">
      <span class="w-8 h-8 flex-shrink-0">
        <span class="relative flex h-full items-center justify-center">
          <Icon src={SquaresPlus} mini class="w-6" />
        </span>
      </span>
      <span class="flex-grow text-left">Apps</span>
    </a>
  </div>
  <div class="flex-grow overflow-y-auto px-2">
    <ThreadsInSidebar />
  </div>
  <div class="min-h-min">
   <!--@TODO: settings button-->
  </div>
</div>