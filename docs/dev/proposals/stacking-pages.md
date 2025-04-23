# Stacking Pages (spages)

## Overview
This proposal outlines a system for implementing "stacking pages" in Supa, drawing inspiration from the ttabs (tiling tabs) architecture. Stacking pages provide a way to layer UI screens on top of each other with smooth transitions, navigation history, and a consistent API modeled after ttabs.

## Motivation
While ttabs provides excellent functionality for tiling UI components in a persistent layout, there's also a need for temporary, modal-like screens that:

1. Stack on top of the current view
2. Can be navigated via breadcrumbs/back buttons
3. Maintain a history stack that can be manipulated
4. Share a consistent component registration system with ttabs

Common use cases include settings screens, configuration dialogs, and temporary focused workflows where a user needs to complete a task before returning to their main context.

## Architecture

### Core Components
- **Spages**: Main class managing the page stack, component registry, and navigation
- **SpagesRoot**: Container component that renders the current stack of pages
- **SpagedView**: Individual page container with transition effects
- **BreadcrumbNav**: Optional navigation component showing the stack history

### Data Structure
- Pages are stored in an ordered array representing the visual stack
- Each page tracks:
  - Component ID
  - Component props
  - Metadata (title, icon, animation preferences)
  - Stack position

### Page Stack Operations

```js
// Core API
spages.open('settings', props);     // Open a page at the top of the stack
spages.pop();                      // Remove the top page
spages.popTo(pageId);              // Pop until reaching a specific page
spages.replace('newPage', props);  // Replace current top page
spages.clear();                    // Remove all pages
```

### Component Registration (Similar to ttabs)

```js
// Register components
spages.registerComponent('settings', SettingsComponent);
spages.registerComponent('providers', ProvidersComponent, { defaultProp: 'value' });
```

## Implementation Details

### Spages Class
The main class would be implemented following patterns from ttabs:

```typescript
export class Spages {
  pages: PageEntry[] = $state([]);
  componentRegistry: Record<string, PageComponent> = $state({});
  
  // Add page to top of stack
  open(componentId: string, props?: Record<string, any>, options?: PageOptions): string {
    // Implementation
  }
  
  // Remove top page
  pop(): boolean {
    // Implementation
  }
  
  // Other methods: popTo, replace, clear, etc.
  
  // ttabs-like component registration
  registerComponent(componentId: string, component: Component, defaultProps?: Record<string, any>): void {
    // Implementation
  }
}
```

### Transitions
- Pages would have entry/exit animations (slide, fade, etc.)
- Configurable transition timing and effects
- Option to disable animations for accessibility/performance

### Event System
- Page lifecycle events (beforeOpen, afterOpen, beforeClose, afterClose)
- Navigation events for intercepting/canceling navigation
- State change subscription similar to ttabs

### History Management
The Spages system includes a simple but reliable history management system that allows for browser-like back and forward navigation without URL manipulation:

```typescript
export class Spages {
  // Page stack
  pages: PageEntry[] = $state([]);
  
  // Internal history tracking
  private history: HistoryEntry[] = $state([]);
  private historyIndex = $state(-1);
  
  type HistoryEntry = {
    pageStack: PageEntry[];  // Snapshot of pages at this point in history
    action: 'open' | 'pop' | 'popTo' | 'replace' | 'clear';
  }
  
  // Navigation methods add to history
  open(componentId: string, props?: Record<string, any>, options?: PageOptions): string {
    // Add page to stack...
    
    // Record in history
    this.recordNavigation('open', [...this.pages]);
    
    return pageId;
  }
  
  // Methods for history navigation
  back(): boolean {
    if (this.historyIndex <= 0) return false;
    
    this.historyIndex--;
    this.applyHistoryState(this.history[this.historyIndex]);
    return true;
  }
  
  forward(): boolean {
    if (this.historyIndex >= this.history.length - 1) return false;
    
    this.historyIndex++;
    this.applyHistoryState(this.history[this.historyIndex]);
    return true;
  }
  
  // History state helpers
  canGoBack(): boolean {
    return this.historyIndex > 0;
  }
  
  canGoForward(): boolean {
    return this.historyIndex < this.history.length - 1;
  }
  
  // Record changes to history
  private recordNavigation(action: HistoryEntry['action'], pageStack: PageEntry[]): void {
    // Truncate forward history when new navigation occurs
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    
    // Add new entry and update index
    this.history.push({ action, pageStack: [...pageStack] });
    this.historyIndex = this.history.length - 1;
  }
  
  // Apply a history state 
  private applyHistoryState(entry: HistoryEntry): void {
    // Restore the page stack from history
    this.pages = [...entry.pageStack];
  }
}
```

This approach allows for:

- Tracking a complete history of page navigation
- Supporting back/forward operations
- Maintaining UI state for each history entry
- Keyboard navigation via Alt+Left/Right arrow shortcuts
- Integration with breadcrumb navigation for visual history
- Consistent behavior matching user expectations

The history system does not manipulate browser URLs, keeping implementation simple while providing reliable navigation within the application.

### Integration with ttabs
While spages and ttabs are separate systems, they share a consistent API design for component registration, making the developer experience more intuitive:

```js
// Create both layout systems
const ttabs = new Ttabs();
const spages = new Spages();

// Register a component in each system with the same API pattern
const ChatComponent = { /* ... */ };
const SettingsComponent = { /* ... */ };

// Similar API for registration
ttabs.registerComponent('chat', ChatComponent, { defaultProps: {} });
spages.registerComponent('settings', SettingsComponent, { defaultProps: {} });

// Each system uses its own registered components
ttabs.addTab('myTab', 'Chat');
ttabs.setComponent('myTab', 'chat', { conversationId: '123' });

// Spages has its own independent component registry
spages.open('settings', { section: 'general' });
```

## Usage Examples

### Basic Usage
```svelte
<script>
  import { Spages, SpagesRoot } from 'spages-svelte';
  import Settings from './Settings.svelte';
  import Providers from './Providers.svelte';
  
  const spages = new Spages();
  spages.registerComponent('settings', Settings);
  spages.registerComponent('providers', Providers);
  
  function openSettings() {
    spages.open('settings', { section: 'general' });
  }
</script>

<div class="app">
  <button onclick={openSettings}>Open Settings</button>
  <SpagesRoot {spages} />
</div>
```

### Advanced Integration with ttabs
```svelte
<script>
  import { Ttabs, TtabsRoot } from 'ttabs-svelte';
  import { Spages, SpagesRoot } from 'spages-svelte';
  import ChatView from './ChatView.svelte';
  import DetailView from './DetailView.svelte';
  
  // Initialize both systems
  const ttabs = new Ttabs();
  const spages = new Spages();
  
  // Register components with each system independently
  ttabs.registerComponent('chat', ChatView);
  spages.registerComponent('detail-view', DetailView);
  
  function openPageFromTab(tabId) {
    const tab = ttabs.getTab(tabId);
    if (tab) {
      spages.open('detail-view', { contextId: tab.id });
    }
  }
</script>

<div class="app-container">
  <!-- Main workspace with tabs -->
  <TtabsRoot {ttabs} />
  
  <!-- Stackable pages that appear on top -->
  <SpagesRoot {spages} />
</div>
```

## Implementation Phases

### Phase 1: Core Functionality
- Basic Spages class with open/pop operations
- Component registration system
- SpagesRoot container component
- Simple transitions

### Phase 2: Navigation & History
- Breadcrumb component
- History manipulation (popTo, replace)
- Enhanced transition options
- Event system

### Phase 3: Integration & Polish
- ttabs integration helpers
- Accessibility improvements
- Performance optimization
- Advanced styling and theming

## Benefits
1. Consistent API with ttabs for better developer experience
2. Simplified state management for temporal UI flows
3. Clear visual hierarchy for users
4. Built-in transitions and navigation
5. Reusable component registry pattern

## Single Page Mode

Instead of visually stacking multiple modal-like pages, spages can operate in a "single page mode" where content updates within a single modal container while maintaining navigation history:

```typescript
// Configure spages to use single page mode
const spages = new Spages({ singlePageMode: true });

// Open initial page
spages.open('apps', { section: 'marketplace' }, { 
  title: 'Applications'  // This appears in the breadcrumb
});

// Navigate to a sub-section, which replaces content but adds to history
spages.open('appDetail', { id: 'some-app-id' }, {
  title: 'App Details',   // Added to breadcrumb
  updateMode: 'replace'   // Explicitly specify replace behavior
});
```

### Breadcrumb Navigation

In single page mode, the breadcrumb becomes essential for navigation:

```svelte
<script>
  import { Spages, SpagesRoot, BreadcrumbNav } from 'spages-svelte';
  
  const spages = new Spages({ singlePageMode: true });
  spages.registerComponent('apps', AppsComponent);
  spages.registerComponent('appDetail', AppDetailComponent);
</script>

<SpagesRoot {spages}>
  <svelte:fragment slot="header">
    <BreadcrumbNav {spages} 
      onNavigate={(index) => spages.popTo(index)} />
  </svelte:fragment>
</SpagesRoot>
```

The `BreadcrumbNav` component would render something like:

```
Applications > App Details
```

Clicking on "Applications" would use the history system to return to that state, preserving the context and props from when it was originally opened.

### Implementation Details

In single page mode:

1. The `open()` method updates the current page rather than adding a new one visually
2. History entries are still created for each navigation
3. The breadcrumb component displays the full path based on page titles
4. The `pop()` and `popTo()` methods navigate through history
5. Transitions can be applied between content changes

Each page in the history maintains:
- Component to render
- Props/data for that component
- Display title for the breadcrumb
- Any other metadata needed for restoration

This approach provides a cleaner, less cluttered UI while maintaining the benefits of the spages navigation system.

## Page Navigation Model

The spages system uses a single-page navigation model where all navigation occurs within one modal-like container, maintaining a linear history:

```typescript
// Initialize the spages system
const spages = new Spages();

// Open initial page
spages.open('apps', { section: 'marketplace' }, { 
  title: 'Applications'  // This appears in the breadcrumb
});

// Navigate to a sub-section, which updates content and adds to history
spages.open('appDetail', { id: 'some-app-id' }, {
  title: 'App Details'   // Added to breadcrumb
});
```

### Breadcrumb Navigation

With this model, breadcrumbs are integrated directly into the SpagesRoot component:

```svelte
<script>
  import { Spages, SpagesRoot } from 'spages-svelte';
  
  const spages = new Spages();
  spages.registerComponent('apps', AppsComponent);
  spages.registerComponent('appDetail', AppDetailComponent);
</script>

<SpagesRoot {spages} />
```

The SpagesRoot component automatically renders the breadcrumb navigation bar at the top:

```
Applications > App Details
```

Clicking on "Applications" would navigate back to that state, preserving the context and props from when it was originally opened.

### Implementation Details

In this model:

1. The `open()` method always updates the current page content while adding to navigation history
2. Each navigation action creates a new history entry
3. The integrated breadcrumb navigation displays the full path based on page titles
4. The `pop()` and `popTo()` methods navigate backward through history
5. Transitions can be applied between content changes

Each page in the history maintains:
- Component to render
- Props/data for that component
- Display title for the breadcrumb
- Any other metadata needed for restoration

This approach provides a clean, focused UI while maintaining a clear navigation model that users can easily understand.

## Open Questions
- Should pages have size constraints or always be full screen?
- How should keyboard shortcuts be handled with stacked pages?
- What accessibility considerations need to be addressed?
- Should there be a concept of "modal" vs "page" for different use cases? 

## Answers to Open Questions

- **Size constraints:** Pages will use modal-like visuals borrowed from Skeleton, including background styling and opening animations, appearing as large modals rather than always being full screen.

- **Keyboard shortcuts:** Will follow standard browser navigation patterns (Alt+Left/Right or equivalent platform-specific shortcuts) for back/forward navigation.

- **Accessibility:** No specific considerations needed at the moment.

- **Modal vs. Page concept:** The system will support both:
  - The spages system will handle the navigation stack for larger page-like content
  - The existing Skeleton modals will continue to work independently
  - Both systems can coexist, with modals being openable within spaged content
  - No direct communication is needed between these systems; they operate in parallel 