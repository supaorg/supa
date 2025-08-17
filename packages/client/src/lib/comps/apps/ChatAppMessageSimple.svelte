<script lang="ts">
  import { onMount } from 'svelte';
  import { clientState } from '@sila/client/state/clientState.svelte';
  import { ClientFileResolver } from '@sila/client/utils/fileResolver';
  import FileReferencePreview from '../files/FileReferencePreview.svelte';
  import type { SimpleAttachment } from '@sila/client/types/attachments';
  import type { ThreadMessage } from '@sila/core';

  let {
    message,
    showGallery = false,
    onGalleryOpen,
  }: {
    message: ThreadMessage;
    showGallery?: boolean;
    onGalleryOpen: () => void;
  } = $props();

  let simpleAttachments: SimpleAttachment[] = $state([]);
  let isLoading = $state(true);

  // Extract simple attachments from message
  function extractSimpleAttachments(msg: ThreadMessage): SimpleAttachment[] {
    const attachments = (msg as any).attachments;
    if (!attachments || !Array.isArray(attachments)) {
      return [];
    }

    return attachments
      .filter((att: any) => att?.file?.tree && att?.file?.vertex)
      .map((att: any) => ({
        id: att.id,
        kind: att.kind,
        file: att.file,
        alt: att.alt,
      } as SimpleAttachment));
  }

  onMount(() => {
    simpleAttachments = extractSimpleAttachments(message);
    isLoading = false;
  });

  // Update attachments when message changes
  $effect(() => {
    simpleAttachments = extractSimpleAttachments(message);
  });
</script>

<div class="chat-message">
  <!-- Message text -->
  <div class="message-text">
    {message.text}
  </div>

  <!-- File attachments -->
  {#if simpleAttachments.length > 0}
    <div class="attachments-container mt-4 space-y-2">
      {#each simpleAttachments as attachment (attachment.id)}
        <div class="attachment-item">
          <FileReferencePreview 
            fileRef={attachment.file}
            {showGallery}
            {onGalleryOpen}
          />
          {#if attachment.alt}
            <div class="attachment-alt text-sm text-surface-500-500-token mt-1">
              {attachment.alt}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <!-- Loading state -->
  {#if isLoading}
    <div class="loading-attachments mt-4">
      <div class="animate-pulse bg-surface-100-900 rounded h-8"></div>
    </div>
  {/if}
</div>

<style>
  .chat-message {
    @apply p-4;
  }

  .message-text {
    @apply text-surface-900-100-token leading-relaxed;
  }

  .attachments-container {
    @apply flex flex-col;
  }

  .attachment-item {
    @apply max-w-md;
  }

  .attachment-alt {
    @apply italic;
  }

  .loading-attachments {
    @apply space-y-2;
  }
</style>