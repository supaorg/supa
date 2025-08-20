<script lang="ts">
  import { Send, StopCircle, Paperclip, Plus, Image as ImageIcon } from "lucide-svelte";
  import ContextMenu from "@sila/client/comps/ui/ContextMenu.svelte";
  import AppConfigDropdown from "@sila/client/comps/apps/AppConfigDropdown.svelte";
  import { onMount, tick } from "svelte";
  import { focusTrap } from "@sila/client/utils/focusTrap";
  import { type MessageFormStatus } from "./messageFormStatus";
  import { txtStore } from "@sila/client/state/txtStore";
  import { clientState } from "@sila/client/state/clientState.svelte";
  import type { ChatAppData } from "@sila/core";
  import type { AttachmentPreview } from "@sila/core";
  import { processFileForUpload, optimizeImageSize, toDataUrl, getImageDimensions, processTextFileForUpload, optimizeTextFile, readFileAsText, extractTextFileMetadata, type TextFileMetadata } from "@sila/client/utils/fileProcessing";

  const TEXTAREA_BASE_HEIGHT = 40; // px
  const TEXTAREA_LINE_HEIGHT = 1.5; // normal line height

  // Using shared AttachmentPreview type from core

  interface SendMessageFormProps {
    onSend: (msg: string, attachments?: AttachmentPreview[]) => void;
    onStop?: () => void;
    isFocused?: boolean;
    placeholder?: string;
    status?: MessageFormStatus;
    disabled?: boolean;
    draftId?: string;
    maxLines?: number;
    attachEnabled?: boolean;
    data?: ChatAppData;
    showConfigSelector?: boolean;
  }

  let {
    onSend,
    onStop = () => {},
    isFocused = true,
    placeholder = $txtStore.messageForm.placeholder,
    status = "can-send-message",
    disabled = false,
    draftId,
    maxLines = Infinity,
    attachEnabled = true,
    data = undefined,
    showConfigSelector = true,
  }: SendMessageFormProps = $props();

  function openModelProvidersSettings() {
    clientState.layout.swins.open("model-providers", {}, "Model Providers");
  }

  let query = $state("");
  let isTextareaFocused = $state(false);
  let textareaElement: HTMLTextAreaElement | null = $state(null);
  let isSending = $state(false);
  let attachmentsMenuOpen = $state(false);
  let fileInputEl: HTMLInputElement | null = $state(null);
  let pendingAttachments = $state<AttachmentPreview[]>([]);

  let canSendMessage = $derived(
    !disabled && status === "can-send-message" && (query.trim().length > 0 || pendingAttachments.length > 0),
  );

  let configId = $state("");

  function handleConfigChange(id: string) {
    if (data) {
      data.configId = id;
    }
  }

  onMount(() => {
    if (data && data.configId) {
      configId = data.configId;
    }

    const observeData = data?.observe((d) => {
      const configIdFromData = d.configId;
      if (configIdFromData !== configId) {
        configId = configIdFromData as string;
      }
    });

    return () => {
      observeData?.();
    };
  });

  onMount(async () => {
    await loadDraft();

    if (isFocused) {
      textareaElement?.focus();
    }
  });

  async function loadDraft() {
    if (!draftId) {
      return;
    }

    const draftContent = await clientState.currentSpaceState?.getDraft(draftId);
    if (draftContent) {
      query = draftContent;
      // Adjust height after loading draft content into the textarea
      await tick();
      adjustTextareaHeight();
    }
  }

  async function onFilesSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;
    const selected = Array.from(files);

    const previews: AttachmentPreview[] = [];
    for (const file of selected) {
      try {
        // Check if it's a text file first
        const isText = await processTextFileForUpload(file).then(() => true).catch(() => false);
        
        if (isText) {
          // Process text file
          const processedFile = await processTextFileForUpload(file);
          const optimizedFile = await optimizeTextFile(processedFile);
          
          // Read text content
          const content = await readFileAsText(optimizedFile);
          const metadata = extractTextFileMetadata(optimizedFile, content);
          
          previews.push({
            id: crypto.randomUUID(),
            kind: 'text',
            name: optimizedFile.name,
            mimeType: optimizedFile.type,
            size: optimizedFile.size,
            content,
            metadata,
            width: metadata.charCount, // Use charCount as width (horizontal length)
            height: metadata.lineCount, // Use lineCount as height (vertical lines)
            alt: metadata.language, // Use language as alt text
          });
        } else {
          // Process image file
          const processedFile = await processFileForUpload(file);
          const optimizedFile = await optimizeImageSize(processedFile);
          
          // Only images for now
          if (!optimizedFile.type.startsWith('image/')) continue;
          
          const dataUrl = await toDataUrl(optimizedFile);
          const dims = await getImageDimensions(dataUrl);
          
          previews.push({
            id: crypto.randomUUID(),
            kind: 'image',
            name: optimizedFile.name, // Use converted filename
            mimeType: optimizedFile.type, // Use optimized MIME type
            size: optimizedFile.size,
            dataUrl,
            width: dims?.width,
            height: dims?.height,
          });
        }
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
      }
    }

    pendingAttachments = [...pendingAttachments, ...previews];
    // reset input to allow re-selecting the same file
    if (fileInputEl) fileInputEl.value = "";
    attachmentsMenuOpen = false;
  }

  function removeAttachment(id: string) {
    pendingAttachments = pendingAttachments.filter(a => a.id !== id);
  }

  function openFilePicker() {
    fileInputEl?.click();
  }



  function adjustTextareaHeight() {
    if (!textareaElement) return;

    // Reset height to initial value to allow proper scrollHeight calculation
    textareaElement.style.height = `${TEXTAREA_BASE_HEIGHT}px`;
    textareaElement.style.overflowY = "hidden";

    // Get the scroll height which represents the height needed to show all content
    const scrollHeight = textareaElement.scrollHeight;

    // Calculate the maximum height based on maxLines
    const lineHeight = TEXTAREA_LINE_HEIGHT * 16; // assuming 16px font size
    const maxHeight = maxLines * lineHeight;

    if (scrollHeight > TEXTAREA_BASE_HEIGHT) {
      // Set the height to either the scroll height or max height, whichever is smaller
      textareaElement.style.height = `${Math.min(scrollHeight, maxHeight)}px`;

      // Only show scrollbars if content exceeds max height
      if (scrollHeight > maxHeight) {
        textareaElement.style.overflowY = "auto";
      } else {
        textareaElement.style.overflowY = "hidden";
      }
    } else {
      // Set to base height and hide scrollbars if content is small
      textareaElement.style.height = `${TEXTAREA_BASE_HEIGHT}px`;
      textareaElement.style.overflowY = "hidden";
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      sendMsg();

      return;
    }
    adjustTextareaHeight();
  }

  function handleInput() {
    // Skip if we're in the process of sending a message
    if (isSending) {
      return;
    }

    adjustTextareaHeight();

    // Save or clear draft based on content
    if (draftId) {
      const trimmedQuery = query.trim();

      if (trimmedQuery.length > 0) {
        clientState.currentSpaceState?.saveDraft(draftId, trimmedQuery);
      } else {
        clientState.currentSpaceState?.deleteDraft(draftId);
      }
    }
  }

  async function sendMsg() {
    if (disabled || status !== "can-send-message") {
      return;
    }

    onSend(query, pendingAttachments);
    isSending = true;
    query = "";
    if (textareaElement) {
      textareaElement.value = "";
    }

    // Clear draft when message is sent
    if (draftId) {
      await clientState.currentSpaceState?.deleteDraft(draftId);
    }

    // Clear in-memory attachments after sending
    pendingAttachments = [];

    // Force reset to base height after clearing content
    if (textareaElement) {
      textareaElement.style.height = `${TEXTAREA_BASE_HEIGHT}px`;
      textareaElement.style.overflowY = "hidden"; // Reset overflow to prevent scrollbars

      await tick();
      adjustTextareaHeight();
    }

    isSending = false; // Reset flag after sending is complete
  }

  async function stopMsg() {
    if (status !== "ai-message-in-progress") {
      return;
    }

    onStop();
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
  }

  async function handlePaste(e: ClipboardEvent) {
    if (!attachEnabled || disabled) {
      return;
    }

    const clipboardData = e.clipboardData;
    if (!clipboardData) {
      return;
    }

    let hasProcessedContent = false;
    const previews: AttachmentPreview[] = [];

    // Check for files in clipboard
    const files = Array.from(clipboardData.files || []);
    if (files.length > 0) {
      hasProcessedContent = true;
      
      for (const file of files) {
        try {
          // Check if it's a text file first
          const isText = await processTextFileForUpload(file).then(() => true).catch(() => false);
          
          if (isText) {
            // Process text file
            const processedFile = await processTextFileForUpload(file);
            const optimizedFile = await optimizeTextFile(processedFile);
            
            // Read text content
            const content = await readFileAsText(optimizedFile);
            const metadata = extractTextFileMetadata(optimizedFile, content);
            
            previews.push({
              id: crypto.randomUUID(),
              kind: 'text',
              name: optimizedFile.name,
              mimeType: optimizedFile.type,
              size: optimizedFile.size,
              content,
              metadata,
              width: metadata.charCount, // Use charCount as width (horizontal length)
              height: metadata.lineCount, // Use lineCount as height (vertical lines)
              alt: metadata.language, // Use language as alt text
            });
          } else {
            // Process image file
            const processedFile = await processFileForUpload(file);
            const optimizedFile = await optimizeImageSize(processedFile);
            
            // Only images for now
            if (!optimizedFile.type.startsWith('image/')) continue;
            
            const dataUrl = await toDataUrl(optimizedFile);
            const dims = await getImageDimensions(dataUrl);
            
            previews.push({
              id: crypto.randomUUID(),
              kind: 'image',
              name: optimizedFile.name, // Use converted filename
              mimeType: optimizedFile.type, // Use optimized MIME type
              size: optimizedFile.size,
              dataUrl,
              width: dims?.width,
              height: dims?.height,
            });
          }
        } catch (error) {
          console.error(`Failed to process pasted file ${file.name}:`, error);
        }
      }
    }

    // Check for images in clipboard (e.g., screenshots)
    const imageTypes = clipboardData.types.filter(type => type.startsWith('image/'));
    for (const imageType of imageTypes) {
      try {
        const dataUrl = clipboardData.getData(imageType);
        if (dataUrl && dataUrl.startsWith('data:')) {
          hasProcessedContent = true;
          
          // Convert data URL to blob
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          
          // Convert blob to file
          const file = new File([blob], `pasted-image-${Date.now()}.${imageType.split('/')[1] || 'png'}`, {
            type: imageType,
            lastModified: Date.now()
          });
          
          // Process image file
          const processedFile = await processFileForUpload(file);
          const optimizedFile = await optimizeImageSize(processedFile);
          
          const optimizedDataUrl = await toDataUrl(optimizedFile);
          const dims = await getImageDimensions(optimizedDataUrl);
          
          previews.push({
            id: crypto.randomUUID(),
            kind: 'image',
            name: optimizedFile.name,
            mimeType: optimizedFile.type,
            size: optimizedFile.size,
            dataUrl: optimizedDataUrl,
            width: dims?.width,
            height: dims?.height,
          });
        }
      } catch (error) {
        console.error(`Failed to process pasted image ${imageType}:`, error);
      }
    }

    // Prevent default paste behavior if we processed any files or images
    if (hasProcessedContent) {
      e.preventDefault();
    }

    if (previews.length > 0) {
      pendingAttachments = [...pendingAttachments, ...previews];
    }
  }
</script>

{#if clientState.currentSpaceState?.hasModelProviders}
  <form class="w-full" use:focusTrap={isFocused} onsubmit={handleSubmit}>
    <div class="relative flex w-full items-center">
      <div
        class="flex w-full flex-col rounded-lg bg-surface-50-950 transition-colors ring"
        class:ring-primary-300-700={isTextareaFocused}
        class:ring-surface-300-700={!isTextareaFocused}
      >
        <textarea
          bind:this={textareaElement}
          class="block w-full resize-none border-0 bg-transparent p-2 leading-normal outline-none focus:ring-0"
          style="height: {TEXTAREA_BASE_HEIGHT}px; overflow-y: hidden;"
          {placeholder}
          bind:value={query}
          onkeydown={handleKeydown}
          oninput={handleInput}
          onpaste={handlePaste}
          onfocus={() => (isTextareaFocused = true)}
          onblur={() => (isTextareaFocused = false)}
          {disabled}
        ></textarea>

        <!-- Attachments previews (in-memory) -->
        {#if pendingAttachments.length > 0}
          <div class="flex flex-wrap gap-2 px-2 pt-2">
            {#each pendingAttachments as att (att.id)}
              <div class="relative group rounded-md p-1 bg-surface-100-900">
                {#if att.kind === 'text' && att.metadata}
                  <div class="text-xs opacity-70 border rounded px-2 py-1">
                    <div class="font-medium">{att.name}</div>
                    <div class="text-xs opacity-60">
                      {att.metadata.language} • {att.metadata.lineCount} lines • {att.metadata.wordCount} words
                    </div>
                  </div>
                {:else if att.kind === 'image' && att.dataUrl}
                  <img src={att.dataUrl} alt={att.name} class="max-h-16 max-w-24 rounded" />
                {:else}
                  <div class="text-xs opacity-70">{att.name}</div>
                {/if}
                <button class="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-surface-200-800 hover:bg-surface-300-700 flex items-center justify-center"
                        onclick={() => removeAttachment(att.id)} aria-label="Remove attachment">
                  ×
                </button>
              </div>
            {/each}
          </div>
        {/if}

        <!-- Bottom toolbar -->
        <div class="flex items-center justify-between p-2 text-sm">
          <div class="flex items-center gap-2">
            {#if attachEnabled}
              <ContextMenu open={attachmentsMenuOpen} onOpenChange={(e: { open: boolean }) => attachmentsMenuOpen = e.open} placement="top" maxWidth="280px">
                {#snippet trigger()}
                  <button 
                    class="flex items-center justify-center h-9 w-9 rounded-container transition-colors preset-outlined-surface-200-800" 
                    aria-label="Add attachments (or paste files)" 
                    {disabled}
                  >
                    <Plus size={20} />
                  </button>
                {/snippet}
                {#snippet content()}
                  <div class="space-y-2">
                    <button class="flex items-center gap-2 w-full text-left hover:bg-surface-300-700/30 rounded px-2 py-1" onclick={openFilePicker}>
                      <ImageIcon size={18} />
                      <span>Add photos & files</span>
                    </button>
                    <div class="text-xs opacity-60 px-2 py-1 border-t border-surface-300-700/30">
                      💡 You can also paste files directly into the text area
                    </div>
                  </div>
                {/snippet}
              </ContextMenu>
              <input type="file" accept="image/*,.txt,.md,.json,.csv,.js,.ts,.py,.java,.c,.cpp,.h,.cs,.php,.rb,.go,.rs,.swift,.kt,.scala,.sh,.bat,.ps1,.yml,.yaml,.toml,.ini,.cfg,.conf,.xml,.html,.css,.log,.tsv" multiple class="hidden" bind:this={fileInputEl} onchange={onFilesSelected} />
            {/if}

            {#if showConfigSelector}
              <AppConfigDropdown {configId} onChange={handleConfigChange} highlighted={isTextareaFocused} />
            {/if}
          </div>
          <div class="flex items-center gap-2">
            {#if status === "ai-message-in-progress"}
              <button
                onclick={stopMsg}
                class="flex items-center justify-center h-9 w-9 rounded-container transition-colors preset-outlined-surface-200-800"
                aria-label={$txtStore.messageForm.stop}
              >
                <StopCircle size={20} />
              </button>
            {:else}
              <button
                onclick={sendMsg}
                class="flex items-center justify-center h-9 w-9 rounded-container transition-colors"
                class:preset-outlined-primary-500={canSendMessage}
                class:preset-outlined-surface-200-800={!canSendMessage}
                class:opacity-50={!canSendMessage}
                disabled={!canSendMessage}
                aria-label={$txtStore.messageForm.send}
              >
                <Send size={20} />
              </button>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </form>
{:else}
  <div
    class="relative flex w-full flex-col items-center justify-center rounded-lg bg-surface-50-950 p-4 transition-colors ring ring-surface-300-700"
  >
    <p class="mb-4 text-center">Set up a model provider to chat with AI.</p>
    <button class="btn preset-filled" onclick={openModelProvidersSettings}>
      Setup brains
    </button>
  </div>
{/if}
