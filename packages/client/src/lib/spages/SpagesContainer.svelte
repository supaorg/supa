<script lang="ts">
  import { Spages } from './Spages.svelte';
  import { fly, fade } from 'svelte/transition';

  let { spages }: { spages: Spages } = $props();
  
  // Function to handle breadcrumb navigation
  function handleBreadcrumbClick(pageIndex: number) {
    if (pageIndex < spages.pages.length - 1) {
      // If not the last page, use popTo to navigate to this page
      spages.popTo(spages.pages[pageIndex].id);
    }
  }
</script>

<div class="spages-container" class:active={spages.pages.length > 0}>
  {#if spages.pages.length > 0}
    <div 
      class="spages-backdrop fixed top-0 left-0 right-0 bottom-0 z-[898] bg-surface-50/60 dark:bg-surface-950/60" 
      onclick={() => spages.pop()}
      onkeydown={(e) => e.key === "Enter" && spages.pop()}
      role="button"
      tabindex="0"
      in:fade={{ duration: 100 }}
      out:fade={{ duration: 100 }}
    ></div>
    
    <!-- Stack of pages -->
    <div 
      class="spages-content fixed top-0 left-0 right-0 bottom-0 z-[899] flex justify-center items-center p-4"
      in:fly={{ y: 50, duration: 200 }}
      out:fly={{ y: 50, duration: 200 }}
    >
      {#each spages.pages as page, i (page.id)}
        <div 
          class="spage card bg-surface-100-900 p-0 shadow-xl max-w-[800px] w-full"
          style="display: {i === spages.pages.length - 1 ? 'flex' : 'none'};"
        >
          {#if page}
            {@const Component = spages.componentRegistry[page.componentId]}
            
            {#if Component}
              <!-- Header with title and breadcrumb navigation -->
              <div class="spage-header">
                <div class="spage-breadcrumbs">
                  {#each spages.pages.slice(0, i + 1) as breadcrumb, index}
                    {#if index > 0}
                      <span class="breadcrumb-separator">›</span>
                    {/if}
                    <button
                      class="breadcrumb-item"
                      class:current={index === i}
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
                  aria-label="Close"
                >×</button>
              </div>
              
              <!-- Render the component with its props -->
              <div class="spage-body">
                <Component.component 
                  {...Component.defaultProps} 
                  {...page.props}
                />
              </div>
            {:else}
              <div class="spage-error">
                Component not found: {page.componentId}
              </div>
            {/if}
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .spages-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: none;
  }
  
  .spages-container.active {
    display: block;
  }
  
  .spages-content {
    max-height: 100vh;
  }
  
  .spage {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    max-height: 100vh;
  }
  
  .spage-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--color-surface-200-800);
  }
  
  .spage-breadcrumbs {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  
  .breadcrumb-item {
    background: none;
    border: none;
    font-size: 0.875rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    cursor: pointer;
    color: var(--color-primary-500);
  }
  
  .breadcrumb-item.current {
    color: var(--color-surface-900-50);
    font-weight: 600;
    cursor: default;
  }
  
  .breadcrumb-item:hover:not(.current) {
    background-color: var(--color-surface-200-800);
  }
  
  .breadcrumb-separator {
    color: var(--color-surface-500);
    font-size: 0.875rem;
  }
  
  .spage-body {
    padding: 1rem;
    overflow-y: auto;
    flex: 1;
  }
  
  .spage-error {
    padding: 2rem;
    color: var(--color-error-500);
    text-align: center;
  }
</style> 