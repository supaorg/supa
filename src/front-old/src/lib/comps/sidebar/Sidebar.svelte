<script lang="ts">
  import ThreadsInSidebar from "./ThreadsInSidebar.svelte";
  import { Cog6Tooth, Icon, SquaresPlus } from "svelte-hero-icons";
  import AgentConfigs from "./AgentConfigs.svelte";
  import WorkspaceSelector from "../WorkspaceSelector.svelte";
</script>

<div class="flex flex-col h-screen">
  <div class="min-h-min px-2 pb-2">
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
  <div class="min-h-min px-2 pt-2">
    <div class="flex items-center">
      <div class="flex-grow min-w-0">
        <WorkspaceSelector />
      </div>
      <a href="/settings" class="sidebar-btn p-2 ml-2 flex-shrink-0">
        <Icon src={Cog6Tooth} mini class="w-6 h-6" />
      </a>
    </div>
  </div>
</div>
