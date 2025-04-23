<script lang="ts">
  import { Spages } from "./Spages.svelte";
  import { fly, fade } from "svelte/transition";

  let { spages }: { spages: Spages } = $props();

  // Function to handle breadcrumb navigation
  function handleBreadcrumbClick(pageIndex: number) {
    if (pageIndex < spages.pages.length - 1) {
      // If not the last page, use popTo to navigate to this page
      spages.popTo(spages.pages[pageIndex].id);
    }
  }
</script>

{#if spages.pages.length > 0}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-[898] bg-surface-50/60 dark:bg-surface-950/60"
    onclick={() => spages.pop()}
    onkeydown={(e) => e.key === "Enter" && spages.pop()}
    role="button"
    tabindex="0"
    in:fade={{ duration: 100 }}
    out:fade={{ duration: 100 }}
  ></div>

  <!-- Stack of pages -->
  <div
    class="fixed inset-0 z-[899] flex justify-center items-center p-4 max-h-screen"
    in:fly={{ y: 50, duration: 200 }}
    out:fly={{ y: 50, duration: 200 }}
  >
    {#each spages.pages as page, i (page.id)}
      <div
        class="card bg-surface-100-900 shadow-xl max-w-[800px] w-full flex flex-col overflow-hidden max-h-screen"
        style="display: {i === spages.pages.length - 1 ? 'flex' : 'none'};"
      >
        {#if page}
          {@const Component = spages.componentRegistry[page.componentId]}

          {#if Component}
            <!-- Header with title and breadcrumb navigation -->
            <div
              class="flex justify-between items-center p-4 border-b border-surface-200-800"
            >
              <div class="flex items-center flex-wrap gap-1">
                {#each spages.pages.slice(0, i + 1) as breadcrumb, index}
                  {#if index > 0}
                    <span class="text-surface-500 text-sm">›</span>
                  {/if}
                  <button
                    class="bg-transparent border-none text-sm py-1 px-2 rounded text-primary-500 hover:bg-surface-200-800 disabled:hover:bg-transparent disabled:text-surface-900-50 disabled:font-semibold disabled:cursor-default"
                    onclick={() => handleBreadcrumbClick(index)}
                    disabled={index === i}
                  >
                    {breadcrumb.title || breadcrumb.componentId}
                  </button>
                {/each}
              </div>

              <button
                class="btn-icon hover:preset-tonal"
                onclick={() => spages.pop()}
                aria-label="Close">×</button
              >
            </div>

            <!-- Render the component with its props -->
            <div class="p-4 overflow-y-auto flex-1">
              <Component.component
                {...Component.defaultProps}
                {...page.props}
              />
            </div>
          {:else}
            <div class="p-8 text-error-500 text-center">
              Component not found: {page.componentId}
            </div>
          {/if}
        {/if}
      </div>
    {/each}
  </div>
{/if}
