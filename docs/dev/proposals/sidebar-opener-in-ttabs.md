# Sidebar Toggle Button in Ttabs Panel Proposal

## Overview
This proposal outlines adding a sidebar toggle button to the ttabs panel in the Supa application, allowing users to open or close the sidebar from the tabs interface.

## Usage Example
After implementation, we'll be able to add UI components to panels in a simple, declarative way:

```typescript
// In layout.svelte.ts

// 1. Register the SidebarToggle component
ttabs.registerComponent('sidebarToggle', SidebarToggle);

// 2. Find the top-left panel where we want to place the opener button
function findAndUpdateLayoutRefs() {
  // Existing code...
  
  // 3. Add the sidebar toggle to the top-left panel
  const firstPanelId = findTopLeftPanelId();
  if (firstPanelId) {
    const panel = ttabs.getPanelObject(firstPanelId);
    panel.leftComponents = [{ componentId: 'sidebarToggle' }];
    
    // We could add multiple components if needed:
    // panel.rightComponents = [
    //   { componentId: 'syncStatus' },
    //   { componentId: 'themeToggle', props: { theme: 'dark' } }
    // ];
  }
}
```

## Current Architecture
- The sidebar in Supa is controlled via the `sidebar` object in `packages/client/src/lib/ttabs/layout.svelte.ts` which has methods like `toggle()`, `open()`, `close()`, and `setWidth()`
- Ttabs currently provides a tab panel without customization slots for additional UI elements
- TilePanel.svelte renders the tabs but doesn't provide areas for custom components

## Proposed Changes

### 1. Extend TilePanelState (Implementation)
Extend the TilePanelState interface to include arrays of UI components for the left and right sides of the panel:

```typescript
// In types/tile-types.ts

/**
 * Type for panel UI component
 */
export interface PanelUIComponent {
  componentId: string;
  props?: Record<string, any>;
}

/**
 * Panel tile that contains tabs
 */
export interface TilePanelState extends TileBaseState {
  type: 'panel';
  tabs: string[];
  activeTab: string | null;
  // New properties for UI components
  leftComponents?: PanelUIComponent[];
  rightComponents?: PanelUIComponent[];
}
```

### 2. Update TilePanel.svelte Component (Implementation)
Update the TilePanel.svelte component to render panel UI components from the extended panel state. We'll modify the existing panel structure to include areas for UI components on the left and right sides of the tab bar:

```svelte
<!-- In TilePanel.svelte -->
<div
  class="ttabs-panel {ttabs.theme?.classes?.panel || ''}"
  data-tile-id={id}
  class:drop-target={draggedTabId && draggedPanelId !== id}
  role="tabpanel"
>
  <div class="ttabs-panel-bar">
    <!-- Left panel UI components -->
    <div class="ttabs-panel-left">
      {#if panel?.leftComponents?.length}
        {#each panel.leftComponents as leftComp}
          {@const componentData = ttabs.getContentComponent(leftComp.componentId)}
          {#if componentData}
            {@const LeftComponent = componentData.component}
            {@const leftProps = {
              ...componentData.defaultProps,
              ...leftComp.props,
              ttabs,
              panelId: id
            }}
            <LeftComponent {...leftProps} />
          {/if}
        {/each}
      {/if}
    </div>

    <!-- Regular tab bar -->
    <div
      class="ttabs-tab-bar {ttabs.theme?.classes?.['tab-bar'] || ''}"
      bind:this={tabBarElement}
      ondragover={onDragOver}
      ondragenter={onDragEnter}
      ondragleave={onDragLeave}
      ondrop={onDrop}
      role="tablist"
      aria-label="Tabs"
      tabindex="0"
    >
      {#each tabs as tab (tab.id)}
        <!-- Tab headers rendering -->
      {/each}
    </div>

    <!-- Right panel UI components -->
    <div class="ttabs-panel-right">
      {#if panel?.rightComponents?.length}
        {#each panel.rightComponents as rightComp}
          {@const componentData = ttabs.getContentComponent(rightComp.componentId)}
          {#if componentData}
            {@const RightComponent = componentData.component}
            {@const rightProps = {
              ...componentData.defaultProps,
              ...rightComp.props,
              ttabs,
              panelId: id
            }}
            <RightComponent {...rightProps} />
          {/if}
        {/each}
      {/if}
    </div>
  </div>

  <!-- Tab content area (unchanged) -->
  <div class="ttabs-tab-content">
    <!-- Content rendering -->
  </div>
</div>
```

We'll also need to add CSS for the new elements:

```css
.ttabs-panel-bar {
  display: flex;
  width: 100%;
  align-items: center;
  background-color: var(--ttabs-tab-bar-bg);
  border-bottom: var(--ttabs-tab-bar-border);
}

.ttabs-panel-left, .ttabs-panel-right {
  display: flex;
  align-items: center;
  padding: 0 var(--ttabs-panel-ui-padding, 4px);
}

.ttabs-tab-bar {
  flex: 1;
  overflow-x: auto;
}
```

### 3. Extend Panel Class with Component Properties (Implementation)
Update the Panel class in ttabsObjects.ts to expose leftComponents and rightComponents as properties:

```typescript
// In ttabsObjects.ts

export class Panel extends TileObject {
  // Existing methods...
  
  /**
   * Get or set the left components of the panel
   */
  get leftComponents(): PanelUIComponent[] {
    const panel = this.ttabs.getPanel(this._id);
    return panel.leftComponents || [];
  }
  
  set leftComponents(components: Array<{ componentId: string, props?: Record<string, any> }>) {
    this.ttabs.updateTile(this._id, { 
      leftComponents: components.map(c => ({
        componentId: c.componentId,
        props: c.props || {}
      }))
    });
  }
  
  /**
   * Get or set the right components of the panel
   */
  get rightComponents(): PanelUIComponent[] {
    const panel = this.ttabs.getPanel(this._id);
    return panel.rightComponents || [];
  }
  
  set rightComponents(components: Array<{ componentId: string, props?: Record<string, any> }>) {
    this.ttabs.updateTile(this._id, { 
      rightComponents: components.map(c => ({
        componentId: c.componentId,
        props: c.props || {}
      }))
    });
  }
}
```

### 4. Create SidebarToggle Component
Create a new component that toggles the sidebar, with appropriate styling to match Supa's design system:

```svelte
<script lang="ts">
  import { sidebar } from "$lib/ttabs/layout.svelte";
  import { Menu, PanelLeftClose } from "lucide-svelte";
  
  // Props passed from ttabs
  let ttabs: any;
  let panelId: string;
  
  function toggleSidebar() {
    sidebar.toggle();
  }
</script>

<button 
  class="sidebar-toggle btn btn-sm variant-ghost-surface btn-icon" 
  onclick={toggleSidebar} 
  aria-label={sidebar.isOpen ? 'Close sidebar' : 'Open sidebar'}
>
  {#if sidebar.isOpen}
    <PanelLeftClose size={16} />
  {:else}
    <Menu size={16} />
  {/if}
</button>

<style>
  .sidebar-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 0.25rem;
  }
</style>
```

### 5. Integration in Supa
Integrate the sidebar opener in `layout.svelte.ts` by first registering the component and then applying it to the top-left panel:

```typescript
// In layout.svelte.ts
import SidebarToggle from "$lib/comps/sidebar/SidebarToggle.svelte";

// Register the SidebarToggle component
ttabs.registerComponent('sidebarToggle', SidebarToggle);

// Find and update layout references to determine the top-left panel
function findAndUpdateLayoutRefs() {
  // Existing code...
  
  // After determining the first panel in the layout,
  // add the sidebar toggle to it
  const firstPanelId = findTopLeftPanelId();
  if (firstPanelId) {
    const panel = ttabs.getPanelObject(firstPanelId);
    panel.leftComponents = [{ componentId: 'sidebarToggle' }];
  }
}

// Helper function to find the top-left panel
function findTopLeftPanelId(): string | undefined {
  const tiles = ttabs.getTiles();
  
  // Find the first column in the root row
  const rootGridId = ttabs.rootGridId;
  const rootGrid = tiles[rootGridId];
  
  if (!rootGrid || rootGrid.type !== 'grid' || rootGrid.rows.length === 0) {
    return undefined;
  }
  
  const topRowId = rootGrid.rows[0];
  const topRow = tiles[topRowId];
  
  if (!topRow || topRow.type !== 'row' || topRow.columns.length < 2) {
    return undefined;
  }
  
  // Get the second column (content area, not sidebar)
  const contentColumnId = topRow.columns[1];
  const contentColumn = tiles[contentColumnId];
  
  if (!contentColumn || contentColumn.type !== 'column' || !contentColumn.child) {
    return undefined;
  }
  
  // Get the content grid
  const contentGridId = contentColumn.child;
  const contentGrid = tiles[contentGridId];
  
  if (!contentGrid || contentGrid.type !== 'grid' || contentGrid.rows.length === 0) {
    return undefined;
  }
  
  // Get the first row in the content grid
  const contentRowId = contentGrid.rows[0];
  const contentRow = tiles[contentRowId];
  
  if (!contentRow || contentRow.type !== 'row' || contentRow.columns.length === 0) {
    return undefined;
  }
  
  // Get the first column in the content row
  const firstColId = contentRow.columns[0];
  const firstCol = tiles[firstColId];
  
  if (!firstCol || firstCol.type !== 'column' || !firstCol.child) {
    return undefined;
  }
  
  // Get the panel in this column
  const panelId = firstCol.child;
  const panel = tiles[panelId];
  
  if (!panel || panel.type !== 'panel') {
    return undefined;
  }
  
  return panelId;
}
```

## Implementation Considerations
- Keep the design consistent with the existing UI using Skeleton UI components
- The sidebar opener button should only be visible when the sidebar is closed
- Only show the button on the top-left panel in the content area
- Keep implementation simple by using existing patterns in the codebase
- Ensure the implementation preserves all current drag-and-drop functionality
- Use minimal changes to the ttabs package to maintain its generic nature
- Keep panel UI logic in Supa's client code (layout.svelte.ts) rather than in ttabs
- Consider the impact on mobile layouts where screen space is limited

## Benefits
- Improves UX by allowing users to open the sidebar from the tabs panel when needed
- Creates a more flexible ttabs component that can be customized for other needs
- Maintains a clean interface by only showing the button when relevant


The proposed solution is preferred as it integrates naturally with the existing UI paradigm while minimizing changes to the ttabs package. It also keeps Supa-specific logic (determining which panel is top-left) in the Supa codebase rather than in the reusable ttabs package.
