<script lang="ts">
  import { onMount } from "svelte";
  import { FilesAppData } from "@sila/core";
  import type { Vertex } from "@sila/core";

  let { data }: { data: FilesAppData } = $props();
  let files = $state<Vertex[]>([]);

  onMount(() => {
    files = data.fileVertices;
  });
</script>

<div class="flex flex-col w-full h-full overflow-hidden">
  <div class="flex-grow overflow-y-auto pt-2">
    <div class="w-full max-w-4xl mx-auto">
      <h2 class="h2 mb-4">Files</h2>
      {#if files.length === 0}
        <p class="text-muted-foreground">No files yet. Files will appear here when you attach them to chat messages.</p>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each files as file (file.id)}
            <div class="border rounded-lg p-4">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-sm font-medium">{file.getProperty("name")}</span>
              </div>
              <div class="text-xs text-muted-foreground">
                <div>Type: {file.getProperty("mimeType") || "Unknown"}</div>
                {#if file.getProperty("size")}
                  <div>Size: {file.getProperty("size")} bytes</div>
                {/if}
                {#if file.getProperty("width") && file.getProperty("height")}
                  <div>Dimensions: {file.getProperty("width")} × {file.getProperty("height")}</div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
