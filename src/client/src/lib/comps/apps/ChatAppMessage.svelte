<script lang="ts">
  import type { ReplicatedTree } from "@shared/replicatedTree/ReplicatedTree";
  import type { VertexChangeEvent } from "@shared/replicatedTree/treeTypes";
  import Self from "./ChatAppMessage.svelte";

  import { User, Sparkles, CircleAlert } from "lucide-svelte";

  let { id, tree }: { id: string; tree: ReplicatedTree } = $props();

  type Message = {
    id: string;
    role: "user" | "assistant";
    text: string;
    createdAt: number;
  };

  let activeChild: string | undefined = $state(undefined);

  let canRetry = $state(false);
  let retrying = $state(false);
  let msgChange = $state(0);

  let message: Message = $derived.by(() => { 
    // @TODO: change how messages are updated, get rid of the hack
    // HACK: force a re-render when the message changes by capturing the msgChange state
    console.log("msgChange", msgChange);

    return {
      id,
      role: tree.getVertexProperty(id, "role")?.value as "user" | "assistant",
      text: tree.getVertexProperty(id, "text")?.value as string,
      createdAt: tree.getVertexProperty(id, "createdAt")?.value as number,
    } as Message;
  });

  $effect(() => {
    updateChildren();

    tree.subscribe(id, onVertexChange);
    return () => {
      tree.unsubscribe(id, onVertexChange);
    };
  });

  function updateChildren() {
    activeChild = tree.getChildren(id)[0]?.id;
  }

  function onVertexChange(event: VertexChangeEvent) {
    console.log("onVertexChange", event);
    if (event.type === "children") {
      updateChildren();
    }

    if (event.type === "property") {
      // Just trigger a re-render of the message (hack)
      msgChange = msgChange + 1;
    }
  }


  function isMoreThanOneMinuteOld(dateInMs: number) {
    return dateInMs + 60000 < Date.now();
  }

  function formatChatDateToTime(dateInMs: number) {
    const date = new Date(dateInMs);
    return date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Use 24-hour format
    });
  }

  function formatChatDate(dateInMs: number) {
    const date = new Date(dateInMs);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function replaceNewlinesWithHtmlBrs(text: string) {
    // Trim newlines at the start and end
    text = text.replace(/^\n+|\n+$/g, "");
    // Replace remaining newlines with <br />
    return text.replace(/\n/g, "<br />");
  }

  async function retry() {
    retrying = true;
    //await $currentWorkspaceStore?.retryThread(threadId);
    retrying = false;
  }
</script>

<div class="flex flex-1 text-base mx-auto gap-3 w-full">
  <div class="flex-shrink-0 flex flex-col relative items-end">
    <div
      class="gizmo-shadow-stroke flex h-6 w-6 items-center justify-center overflow-hidden"
    >
      {#if message.role === "user"}
        <User size={16} />
      {:else if message.role === "assistant"}
        <Sparkles size={16} />
      {:else}
        <CircleAlert size={16} />
      {/if}
    </div>
  </div>
  <div
    class="card p-4 variant-filled-secondary z-10"
    data-popup={`popup-${message.id}`}
  >
    <p>{formatChatDate(message.createdAt)}</p>
    <div class="arrow variant-filled-secondary"></div>
  </div>
  <div class="relative flex w-full flex-col flex-grow">
    <header class="flex justify-between items-center">
      {#if message.role === "user"}
        <p class="font-bold">You</p>
        <button class="cursor-default"
          ><small class="opacity-50"
            >{formatChatDateToTime(message.createdAt)}</small
          ></button
        >
      {:else if message.role === "assistant"}
        <p class="font-bold">AI</p>
      {:else}
        <p class="font-bold">Error</p>
      {/if}
    </header>
    <div class="thread-message flex-grow leading-relaxed">
      {#if message.role === "user"}
        {@html message.text ? replaceNewlinesWithHtmlBrs(message.text) : ""}
      {:else}
        <!--<MarkdownMessage source={message.text ? message.text : "Loading..."} />-->
        {message.text}
      {/if}

      {#if canRetry && !retrying}
        <button class="btn variant-filled" onclick={retry}>Retry</button>
      {/if}
    </div>
    <div class="mt-1 flex justify-start gap-3 empty:hidden h-7">
      <div class="h-7"></div>
    </div>
  </div>
</div>
{#if activeChild}
  <Self {tree} id={activeChild} />
{/if}
