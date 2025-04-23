<script lang="ts">
  import { Spages } from './Spages.svelte';

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
    <div class="spages-backdrop" onclick={() => spages.pop()}></div>
    
    <!-- Stack of pages -->
    <div class="spages-content">
      {#each spages.pages as page, i (page.id)}
        <div class="spage">
          {#if page}
            {@const component = spages.componentRegistry[page.componentId]}
            
            {#if component}
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
                  class="spage-close-btn" 
                  onclick={() => spages.pop()}
                  aria-label="Close"
                >×</button>
              </div>
              
              <!-- Render the component with its props -->
              <div class="spage-body">
                <svelte:component 
                  this={component.component} 
                  {...component.defaultProps} 
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
    z-index: 1000;
    display: none;
    pointer-events: none;
  }
  
  .spages-container.active {
    display: block;
    pointer-events: auto;
  }
  
  .spages-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
  }
  
  .spages-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 800px;
    max-height: 90vh;
  }
  
  .spage {
    background-color: var(--color-surface-100, #ffffff);
    border-radius: var(--radius-container, 8px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    width: 100%;
  }
  
  .dark .spage {
    background-color: var(--color-surface-900, #1a1a1a);
  }
  
  .spage-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--color-surface-200, #e5e5e5);
  }
  
  .dark .spage-header {
    border-bottom: 1px solid var(--color-surface-800, #333333);
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
    color: var(--color-primary-500, #3b82f6);
  }
  
  .breadcrumb-item.current {
    color: var(--color-surface-900, #111827);
    font-weight: 600;
    cursor: default;
  }
  
  .dark .breadcrumb-item.current {
    color: var(--color-surface-50, #f9fafb);
  }
  
  .breadcrumb-item:hover:not(.current) {
    background-color: var(--color-surface-200, #e5e5e5);
  }
  
  .dark .breadcrumb-item:hover:not(.current) {
    background-color: var(--color-surface-800, #333333);
  }
  
  .breadcrumb-separator {
    color: var(--color-surface-500, #6b7280);
    font-size: 0.875rem;
  }
  
  .spage-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }
  
  .spage-close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }
  
  .spage-close-btn:hover {
    background-color: var(--color-surface-200, #e5e5e5);
  }
  
  .dark .spage-close-btn:hover {
    background-color: var(--color-surface-800, #333333);
  }
  
  .spage-body {
    padding: 1rem;
    overflow-y: auto;
    flex: 1;
  }
  
  .spage-error {
    padding: 2rem;
    color: var(--color-error-500, #ef4444);
    text-align: center;
  }
</style> 