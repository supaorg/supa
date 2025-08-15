<script lang="ts">
  import { onMount } from "svelte";
  import { FilesAppData } from "@sila/core";
  import type { Vertex } from "@sila/core";
  import { Folder, File as FileIcon } from "lucide-svelte";
  import { clientState } from "@sila/client/state/clientState.svelte";

  let { data }: { data: FilesAppData } = $props();

  let filesRoot = $state<Vertex | undefined>(undefined);
  let currentFolder = $state<Vertex | undefined>(undefined);
  let path = $state<Vertex[]>([]);

  let children = $state<Vertex[]>([]);
  let folders = $state<Vertex[]>([]);
  let files = $state<Vertex[]>([]);

  let unobserveCurrent: (() => void) | undefined;

  onMount(() => {
    filesRoot = data.filesVertex;
    if (!filesRoot) return;
    path = [filesRoot];
    currentFolder = filesRoot;
    refreshLists();
    observeCurrentFolder();
  });

  function refreshLists() {
    if (!currentFolder) {
      children = [];
      folders = [];
      files = [];
      return;
    }

    children = currentFolder.children;
    // Folders have _n as their name (not "folder"), files have _n: "file"
    folders = children.filter((v) => {
      const n = v.getProperty("_n");
      return n && n !== "file";
    });
    files = children.filter((v) => v.getProperty("_n") === "file");
  }

  function observeCurrentFolder() {
    unobserveCurrent?.();
    if (!currentFolder) return;
    unobserveCurrent = currentFolder.observe((events) => {
      if (events.some((e) => e.type === "children" || e.type === "property")) {
        refreshLists();
      }
    });
  }

  function enterFolder(folder: Vertex) {
    path = [...path, folder];
    currentFolder = folder;
    refreshLists();
    observeCurrentFolder();
  }

  function goToCrumb(index: number) {
    if (index < 0 || index >= path.length) return;
    path = path.slice(0, index + 1);
    currentFolder = path[path.length - 1];
    refreshLists();
    observeCurrentFolder();
  }

  $effect(() => {
    return () => {
      unobserveCurrent?.();
    };
  });

  function displayName(v: Vertex): string {
    // For folders, use _n property; for files, use name property
    const folderName = v.getProperty("_n");
    if (folderName && folderName !== "file") {
      return folderName as string;
    }
    return (v.name as string | null) ?? "";
  }

  function isImageFile(file: Vertex): boolean {
    const mimeType = file.getProperty("mimeType") as string;
    return mimeType?.startsWith("image/") ?? false;
  }

  function getFileUrl(file: Vertex): string {
    const hash = file.getProperty("hash") as string;
    const mimeType = file.getProperty("mimeType") as string;
    
    // Get space ID from the space object, not the app tree
    const spaceId = (data as any).space.getId();
    
    // Use the electron file system API if available
    if ((window as any).electronFileSystem) {
      return (window as any).electronFileSystem.getFileUrl(spaceId, hash, mimeType);
    }
    
    // Fallback to data URL if electron API not available
    return "";
  }
</script>

<div class="flex flex-col w-full h-full overflow-hidden">
  <div class="flex-grow overflow-y-auto pt-2">
    <div class="w-full max-w-4xl mx-auto">
      <h2 class="h2 mb-2">Files</h2>

      {#if !filesRoot}
        <p class="text-muted-foreground">Files root not found.</p>
      {:else}
        <!-- Breadcrumbs -->
        <div class="flex flex-wrap items-center gap-1 text-sm mb-4">
          {#each path as crumb, i (crumb.id)}
            {#if i > 0}
              <span class="opacity-50">/</span>
            {/if}
            <button
              class="px-1 py-0.5 rounded hover:bg-surface-500/10"
              onclick={() => goToCrumb(i)}
              type="button"
            >
              {displayName(crumb) || (i === 0 ? "Files" : "Unnamed")}
            </button>
          {/each}
        </div>

        <!-- Folders -->
        {#if folders.length > 0}
          <div class="mb-3">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {#each folders as folder (folder.id)}
                <button
                  class="border rounded-lg p-3 text-left hover:bg-surface-500/5"
                  onclick={() => enterFolder(folder)}
                  type="button"
                >
                  <div class="flex items-center gap-2">
                    <Folder size={16} />
                    <span class="text-sm font-medium">{displayName(folder) || "Untitled folder"}</span>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Files -->
        {#if files.length > 0}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {#each files as file (file.id)}
              <div class="border rounded-lg p-3">
                {#if isImageFile(file)}
                  <!-- Image preview -->
                  <div class="mb-2">
                    <img 
                      src={getFileUrl(file)} 
                      alt={displayName(file)}
                      class="w-full h-32 object-cover rounded border"
                      loading="lazy"
                    />
                  </div>
                {/if}
                <div class="flex items-center gap-2 mb-1">
                  <FileIcon size={16} />
                  <span class="text-sm font-medium">{displayName(file) || "Untitled"}</span>
                </div>
                <div class="text-xs text-muted-foreground space-y-0.5">
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

        {#if folders.length === 0 && files.length === 0}
          <p class="text-muted-foreground">This folder is empty.</p>
        {/if}
      {/if}
    </div>
  </div>
</div>
