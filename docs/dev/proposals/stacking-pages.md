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
  pages = $state<PageEntry[]>([]);
  componentRegistry = $state<Record<string, PageComponent>>({});
  
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

### Integration with ttabs
Since both systems share similar component registration patterns, they could be designed to work together:

```js
// Create both layout systems
const ttabs = new Ttabs();
const spages = new Spages();

// Register a component usable in both systems
const MyComponent = { /* ... */ };
ttabs.registerComponent('myComponent', MyComponent);
spages.registerComponent('myComponent', MyComponent);

// Use in ttabs
ttabs.addTab(panelId, 'Tab with component');
ttabs.setComponent(tabId, 'myComponent', { prop: 'value' });

// Use in spages
spages.open('myComponent', { prop: 'value' });
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
  
  const ttabs = new Ttabs();
  const spages = new Spages();
  
  // Register components to both systems
  registerSharedComponents(ttabs, spages);
  
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

## Open Questions
- Should pages have size constraints or always be full screen?
- How should keyboard shortcuts be handled with stacked pages?
- What accessibility considerations need to be addressed?
- Should there be a concept of "modal" vs "page" for different use cases? 