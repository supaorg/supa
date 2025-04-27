<script lang="ts">
  import { Spages } from "./Spages.svelte";
  import { fly, fade } from "svelte/transition";
  import ChevronLeft from "lucide-svelte/icons/chevron-left";
  import X from "lucide-svelte/icons/x";

  let { spages }: { spages: Spages } = $props();

  // Function to handle breadcrumb navigation
  function handleBreadcrumbClick(pageIndex: number) {
    if (pageIndex < spages.pages.length - 1) {
      // If not the last page, use popTo to navigate to this page
      spages.popTo(spages.pages[pageIndex].id);
    }
  }

  // Function to close all pages
  function closeAll() {
    // Close all pages by emptying the stack
    while (spages.pages.length > 0) {
      spages.pop();
    }
  }
</script>

{#if spages.pages.length > 0}
  <!-- Stack of pages -->
  <div
    class="fixed inset-0 z-[899] flex flex-col items-center p-4 pt-20 pb-20 overflow-y-auto"
    in:fly={{ y: 50, duration: 200 }}
    out:fly={{ y: 50, duration: 200 }}
  >
    <div
      class="absolute left-0 top-0 w-full h-full cursor-auto bg-surface-50/80 dark:bg-surface-950/80"
      onclick={closeAll}
      onkeydown={(e) => e.key === "Enter" && closeAll}
      role="button"
      tabindex="0"
      in:fade={{ duration: 100 }}
      out:fade={{ duration: 100 }}
    ></div>
    {#each spages.pages as page, i (page.id)}
      <div
        class="relative card rounded-lg bg-surface-50-950 border-1 border-surface-200-800 shadow-2xl max-w-[800px] w-full flex flex-col overflow-hidden max-h-[calc(100vh-10rem)]"
        style="display: {i === spages.pages.length - 1 ? 'flex' : 'none'};"
      >
        {#if page}
          {@const Component = spages.componentRegistry[page.componentId]}

          {#if Component}
            <!-- Header with title and breadcrumb navigation -->
            <div
              class="flex justify-between items-center p-2 flex-shrink-0"
            >
              <!-- Left section with back button (only visible on sub-pages) -->
              <div class="flex-none">
                {#if i > 0}
                  <button
                    class="btn-icon hover:preset-tonal"
                    onclick={() => spages.pop()}
                    aria-label="Go back"
                  >
                    <ChevronLeft size={18} />
                  </button>
                {/if}
              </div>

              <!-- Center section with breadcrumbs -->
              <div class="flex-1 flex justify-center text-sm">
                <ol class="flex items-center gap-4">
                  {#each spages.pages.slice(0, i + 1) as breadcrumb, index}
                    {#if index > 0}
                      <li class="opacity-50" aria-hidden>&rsaquo;</li>
                    {/if}
                    {#if index === i}
                      <li>{breadcrumb.title || breadcrumb.componentId}</li>
                    {:else}
                      <li>
                        <a
                          class="opacity-60 hover:underline"
                          href="#"
                          onclick={(e) => {
                            e.preventDefault();
                            handleBreadcrumbClick(index);
                          }}
                        >
                          {breadcrumb.title || breadcrumb.componentId}
                        </a>
                      </li>
                    {/if}
                  {/each}
                </ol>
              </div>

              <!-- Right section with close button -->
              <div class="flex-none">
                <button
                  class="btn-icon hover:preset-tonal"
                  onclick={closeAll}
                  aria-label="Close all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <!-- Render the component with its props -->
            <div class="p-3 pt-0 overflow-y-auto flex-1">
              <Component.component
                {...Component.defaultProps}
                {...page.props}
              />
            </div>
          {:else}
            <div class="p-3 text-error-500 text-center">
              Component not found: {page.componentId}
            </div>
          {/if}
        {/if}
      </div>
    {/each}
  </div>
{/if}
