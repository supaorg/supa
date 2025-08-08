<script lang="ts">
  import {
    Sparkles,
    CircleAlert,
    ChevronDown,
    ChevronRight,
  } from "lucide-svelte";
  import type { ThreadMessage } from "@sila/core";
  import type { ChatAppData } from "@sila/core";
  import type { Vertex } from "@sila/core";
  import { onMount } from "svelte";
  import { timeout } from "@sila/core";
  import Markdown from "../markdown/Markdown.svelte";
  import { clientState } from "@sila/client/state/clientState.svelte";
  import FloatingPopover from "@sila/client/comps/ui/FloatingPopover.svelte";
  import ChatAppMessageInfo from "@sila/client/comps/apps/ChatAppMessageInfo.svelte";
  import ChatAssistantInfo from "@sila/client/comps/apps/ChatAssistantInfo.svelte";
  import { Info } from "lucide-svelte";
  import ChatAppMessageControls from "./ChatAppMessageControls.svelte";
  import ChatAppMessageEditForm from "./ChatAppMessageEditForm.svelte";

  let { vertex, data }: { vertex: Vertex; data: ChatAppData } = $props();

  let message: ThreadMessage = $state(vertex.getAsTypedObject<ThreadMessage>());
  let canRetry = $state(false);
  let isLast = $state(false);
  let configName = $state<string | undefined>(undefined);
  let isThinkingExpanded = $state(false);
  let hasThinking = $derived(
    !!message?.thinking &&
      typeof message.thinking === "string" &&
      message.thinking.trim().length > 0,
  );
  let isAIGenerating = $derived(
    !!message?.inProgress && message?.role === "assistant",
  );
  let isEditing = $state(false);
  let editText = $state("");

  let isHoveringOverMessage = $state(false);
  let showEditAndCopyControls = $state(false);

  function getModelDisplayForMessage(): { provider: string; model: string } | null {
    // Only use values stored on the message. If not available, return null (do not show anything)
    const provider = (message as any)?.modelProviderFinal || (message as any)?.modelProvider || null;
    const model = (message as any)?.modelIdFinal || (message as any)?.modelId || null;
    if (provider && model) return { provider, model };
    return null;
  }

  let modelInfo = $derived.by(() => getModelDisplayForMessage());

  async function copyMessage() {
    await navigator.clipboard.writeText(message?.text || "");
  }

  function showControlsBar() {
    isHoveringOverMessage = true;
    showEditAndCopyControls = true;
  }

  function hideControlsBar() {
    isHoveringOverMessage = false;
    timeout(() => {
      if (!isHoveringOverMessage) showEditAndCopyControls = false;
    }, 300);
  }
  // Branch navigation: use siblings under the same parent
  let branchIndex = $derived.by(() => {
    const parent = vertex.parent;
    if (!parent) return 0;
    const siblings = parent.children;
    const idx = siblings.findIndex((s) => s.id === vertex.id);
    return idx >= 0 ? idx : 0;
  });

  // Effect to update config name if config still exists
  $effect(() => {
    if (message?.role === "assistant") {
      const configId = vertex.getProperty("configId") as string;
      if (configId && clientState.currentSpace) {
        const config = clientState.currentSpace.getAppConfig(configId);
        if (config) {
          configName = config.name;
          return;
        }
      }
      // If config doesn't exist anymore, use the saved name
      configName = data.getMessageProperty(message.id, "configName");
    }
  });

  $effect(() => {
    if (!isEditing) {
      editText = message?.text || "";
    }
  });

  onMount(() => {
    const unobserve = data.observeMessage(vertex.id, (msg) => {
      message = msg;
      isLast = data.isLastMessage(vertex.id);

      canRetry =
        isLast &&
        (msg.role === "error" ||
          (isMoreThanOneMinuteOld(msg.createdAt) &&
            data.isMessageInProgress(vertex.id)));
    });

    return () => {
      unobserve();
    };
  });

  function isMoreThanOneMinuteOld(dateInMs: number) {
    return dateInMs + 60000 < Date.now();
  }

  function replaceNewlinesWithHtmlBrs(text: string) {
    // Trim newlines at the start and end
    text = text.replace(/^\n+|\n+$/g, "");
    // Replace remaining newlines with <br />
    return text.replace(/\n/g, "<br />");
  }

  async function retry() {
    data.triggerEvent("retry-message", {
      messageId: vertex.id,
    });
  }

  function rerunInNewBranch() {
    data.triggerEvent("rerun-message", { messageId: vertex.id });
  }

  // Branch switching: use vertex.children and data.switchMain
  function prevBranch() {
    const parent = vertex.parent;
    if (!parent || branchIndex <= 0) return;
    const siblings = parent.children;
    data.switchMain(siblings[branchIndex - 1].id);
  }

  function nextBranch() {
    const parent = vertex.parent;
    if (!parent) return;
    const siblings = parent.children;
    if (branchIndex >= siblings.length - 1) return;
    data.switchMain(siblings[branchIndex + 1].id);
  }
</script>

<div class="flex gap-3 px-4 py-2" class:justify-end={message.role === "user"}>
  {#if message.role !== "user"}
    <div class="flex-shrink-0 mt-1">
      <div class="w-8 h-8 rounded-full flex items-center justify-center">
        {#if message.role === "assistant"}
          <Sparkles size={18} />
        {:else}
          <CircleAlert size={18} />
        {/if}
      </div>
    </div>
  {/if}
  <div class="min-w-0 max-w-[85%]" class:ml-auto={message.role === "user"}>
    {#if message.role !== "user"}
      <div class="flex items-center justify-between gap-2 mt-2">
        <div class="flex items-center gap-2">
          {#if message.role === "assistant"}
            <div class="relative">
              <FloatingPopover placement="right">
                {#snippet trigger()}
                  <span class="font-bold cursor-default hover:opacity-90">{configName || "AI"}</span>
                {/snippet}
                {#snippet content()}
                  <ChatAssistantInfo configId={(vertex.getProperty("configId") as string) || data.getMessageProperty(message.id, "configId")} />
                {/snippet}
              </FloatingPopover>
            </div>
          {:else}
            <p class="font-bold">Error</p>
          {/if}
        </div>
      </div>
    {/if}
    <div>
      {#if message.role === "user"}
        {#if isEditing}
          <ChatAppMessageEditForm
            initialValue={editText}
            onSave={(text) => {
              data.editMessage(vertex.id, text);
              isEditing = false;
            }}
            onCancel={() => (isEditing = false)}
          />
        {:else}
          <div
            class="relative p-3 rounded-lg preset-tonal group"
            role="region"
            onmouseenter={showControlsBar}
            onmouseleave={hideControlsBar}
          >
            {@html replaceNewlinesWithHtmlBrs(message.text || "")}
            <div class="absolute right-0 bottom-[-33px]">
              <ChatAppMessageControls
                {showEditAndCopyControls}
                onCopyMessage={() => copyMessage()}
                onEditMessage={() => (isEditing = true)}
                onRerun={rerunInNewBranch}
                {prevBranch}
                {nextBranch}
                {branchIndex}
                branchesNumber={vertex.parent?.children.length || 0}
              />
            </div>
          </div>
        {/if}
      {:else}
        {#if isEditing}
          <ChatAppMessageEditForm
            initialValue={editText}
            onSave={(text) => {
              data.editMessage(vertex.id, text);
              isEditing = false;
            }}
            onCancel={() => (isEditing = false)}
          />
        {:else}
          <div
            class="relative rounded-lg chat-message group"
            role="region"
            onmouseenter={showControlsBar}
            onmouseleave={hideControlsBar}
          >
            {#if hasThinking}
              <div class="mb-3">
                <button
                  class="flex items-center gap-1 text-surface-500-500-token hover:text-surface-700-300-token group"
                  onclick={() => (isThinkingExpanded = !isThinkingExpanded)}
                >
                  <span class="opacity-70 group-hover:opacity-100">
                    {#if isAIGenerating}
                      <span class="animate-pulse">Thinking...</span>
                    {:else}
                      Thoughts
                    {/if}
                  </span>
                  {#if isThinkingExpanded}
                    <ChevronDown size={12} class="opacity-70 group-hover:opacity-100" />
                  {:else}
                    <ChevronRight size={12} class="opacity-70 group-hover:opacity-100" />
                  {/if}
                </button>
                {#if isThinkingExpanded}
                  <div class="pt-1.5 pb-1 pl-3 pr-0.5 mt-0.5 mb-2 max-h-[300px] overflow-y-auto text-sm opacity-75 border-l-[3px] border-surface-300-600-token/50">
                    <Markdown source={message.thinking || ""} />
                  </div>
                {/if}
              </div>
            {/if}
            <Markdown source={message.text ? message.text : ""} />
            <div class="absolute right-0 bottom-[-33px] flex items-center gap-2">
              <ChatAppMessageControls
                {showEditAndCopyControls}
                onCopyMessage={() => copyMessage()}
                onEditMessage={() => (isEditing = true)}
                {prevBranch}
                {nextBranch}
                {branchIndex}
                branchesNumber={vertex.parent?.children.length || 0}
              />
              {#if showEditAndCopyControls}
                <FloatingPopover placement="top" openDelay={200} closeDelay={150} interactive={true}>
                  {#snippet trigger()}
                    <button class="inline-flex items-center justify-center p-1 transition opacity-70 hover:opacity-100 relative top-[1px]" aria-label="Message info">
                      <Info size={14} />
                    </button>
                  {/snippet}
                  {#snippet content()}
                    <ChatAppMessageInfo message={message} assistantName={configName || data.getMessageProperty(message.id, "configName") || "AI"} />
                  {/snippet}
                </FloatingPopover>
              {/if}
            </div>
          </div>
        {/if}
      {/if}

      {#if canRetry}
        <div class="flex gap-2">
          <button class="btn preset-filled-surface-500" onclick={retry}>Retry</button>
          <button class="btn preset-outline" onclick={rerunInNewBranch}>Re-run (new branch)</button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  :global {
    .chat-message h1 {
      font-size: 1.5rem !important;
      font-weight: bold;
      margin: 0.75rem 0;
    }

    .chat-message h2 {
      font-size: 1.25rem !important;
      font-weight: bold;
      margin: 0.75rem 0;
    }

    .chat-message h3 {
      font-size: 1.125rem !important;
      font-weight: 600;
      margin: 0.5rem 0;
    }

    .chat-message h4 {
      font-size: 1rem !important;
      font-weight: 600;
      margin: 0.5rem 0;
    }

    .chat-message h5 {
      font-size: 0.875rem !important;
      font-weight: 500;
      margin: 0.5rem 0;
    }

    .chat-message h6 {
      font-size: 0.875rem !important;
      font-weight: 500;
      margin: 0.5rem 0;
    }
  }
</style>
