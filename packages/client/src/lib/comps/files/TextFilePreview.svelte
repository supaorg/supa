<script lang="ts">
  import { Download } from 'lucide-svelte';
  import Markdown from '../markdown/Markdown.svelte';
  import type { ResolvedFileInfo } from '@sila/client/lib/utils/fileResolver';
  
  let {
    fileInfo,
    showGallery = false,
  }: {
    fileInfo: ResolvedFileInfo;
    showGallery?: boolean;
  } = $props();

  let content = $state<string | null>(null);
  let isLoading = $state(false);
  let hasError = $state(false);

  // Auto-load content when component mounts
  $effect(() => {
    if (fileInfo && fileInfo.url) {
      loadContent();
    }
  });

  async function loadContent() {
    if (content || isLoading) return;
    
    isLoading = true;
    hasError = false;

    try {
      const response = await fetch(fileInfo.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      content = await response.text();
    } catch (error) {
      console.warn('Failed to fetch text file content:', error);
      hasError = true;
    } finally {
      isLoading = false;
    }
  }

  function handleDownload(e: Event) {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = fileInfo.url;
    link.download = fileInfo.name;
    link.click();
  }

  function renderTextContent(text: string, mimeType?: string): string {
    if (mimeType === 'text/markdown' || mimeType === 'text/x-markdown') {
      return text; // Return raw content for Markdown component
    }
    
    // For plain text, escape HTML and preserve whitespace
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\n/g, '<br>')
      .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
      .replace(/ /g, '&nbsp;');
  }
</script>

<div class="text-preview border rounded-lg p-3 bg-surface-50-950">
  <div class="flex items-center justify-between mb-2">
    <span class="text-sm font-medium">{fileInfo.name}</span>
    <span class="text-xs opacity-60">
      {fileInfo.mimeType || 'text'} • {fileInfo.size ? `${fileInfo.size} bytes` : 'unknown size'}
    </span>
  </div>
  
  <div class="relative">
    {#if isLoading}
      <div class="flex items-center justify-center h-48 text-surface-500-500-token">
        <span class="animate-pulse">Loading...</span>
      </div>
    {:else if hasError}
      <div class="flex items-center justify-center h-48 text-red-500">
        <span>Failed to load content</span>
      </div>
    {:else if content}
      <div 
        class="max-h-48 overflow-y-auto text-sm font-mono whitespace-pre-wrap hover:bg-surface-100-900 rounded p-2 transition-colors"
      >
        {#if fileInfo.mimeType === 'text/markdown' || fileInfo.mimeType === 'text/x-markdown'}
          <div class="prose prose-sm max-w-none">
            <Markdown source={content} />
          </div>
        {:else}
          {@html renderTextContent(content, fileInfo.mimeType)}
        {/if}
      </div>
    {:else}
      <div class="flex items-center justify-center h-48 text-surface-500-500-token">
        <span>Click to load content</span>
      </div>
    {/if}
    
    {#if !content && !isLoading && !hasError}
      <button 
        class="mt-2 btn btn-sm preset-outline"
        onclick={loadContent}
      >
        Load Content
      </button>
    {/if}
  </div>
  
  <button 
    class="absolute top-2 right-2 btn-icon bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
    onclick={handleDownload}
  >
    <Download size={14} />
  </button>
</div>
