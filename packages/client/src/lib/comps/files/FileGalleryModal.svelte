<script lang="ts">
  import { onMount } from 'svelte';
  import { X } from 'lucide-svelte';
  import { getFilePreviewConfig } from '@sila/client/utils/filePreview';
  import { clientState } from '../../state/clientState.svelte';
  import { galleryState } from '@sila/client/state/galleryState.svelte';

  let activeFile = $derived(clientState.gallery.activeFile);
  let isOpen = $derived(clientState.gallery.isOpen);

  let previewConfig = $derived.by(() => {
    if (!activeFile?.mimeType) return null;
    return getFilePreviewConfig(activeFile.mimeType);
  });

  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      clientState.gallery.close();
    }
  }

  function handleBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      clientState.gallery.close();
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

{#if isOpen && activeFile && previewConfig}
  <div 
    class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
    onclick={handleBackdropClick}
  >
    <!-- Close button -->
    <button 
      class="absolute top-4 right-4 btn-icon bg-black/50 text-white hover:bg-black/70 z-10"
      onclick={() => clientState.gallery.close()}
    >
      <X size={20} />
    </button>

    <!-- Content -->
    <div class="relative max-w-full max-h-full p-4">
      {#if previewConfig.previewType === 'image'}
        <img 
          src={activeFile.url} 
          alt={activeFile.name}
          class="max-w-full max-h-full object-contain"
        />
      {:else if previewConfig.previewType === 'video'}
        <video 
          src={activeFile.url} 
          controls 
          class="max-w-full max-h-full"
          autoplay
        />
      {:else if previewConfig.previewType === 'pdf'}
        <iframe 
          src={activeFile.url} 
          class="w-[800px] h-[600px] border-0"
          title={activeFile.name}
        />
      {:else if previewConfig.previewType === 'text' || previewConfig.previewType === 'code'}
        <div class="bg-white text-black p-8 rounded text-center max-w-md">
          <div class="text-6xl mb-4">{previewConfig.icon}</div>
          <h3 class="text-xl font-medium mb-2">{activeFile.name}</h3>
          <p class="text-gray-600 mb-4">
            Text file preview not yet implemented
          </p>
          <button 
            class="btn preset-filled-primary-500" 
            onclick={() => {
              const link = document.createElement('a');
              link.href = activeFile.url;
              link.download = activeFile.name;
              link.click();
            }}
          >
            Download File
          </button>
        </div>
      {:else}
        <div class="bg-white text-black p-8 rounded text-center max-w-md">
          <div class="text-6xl mb-4">{previewConfig.icon}</div>
          <h3 class="text-xl font-medium mb-2">{activeFile.name}</h3>
          <p class="text-gray-600 mb-4">
            This file type cannot be previewed
          </p>
          <button 
            class="btn preset-filled-primary-500" 
            onclick={() => {
              const link = document.createElement('a');
              link.href = activeFile.url;
              link.download = activeFile.name;
              link.click();
            }}
          >
            Download File
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
