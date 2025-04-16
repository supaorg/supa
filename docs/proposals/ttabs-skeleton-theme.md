# ttabs-skeleton Theme Integration Proposal

## Overview

This proposal outlines the integration of [Skeleton UI](https://skeleton.dev/) theming system with ttabs, creating a cohesive and consistent design language across applications using both libraries. Skeleton's color system, typography, and design patterns will be adapted to work with ttabs' existing theme architecture.

## Goals

1. Create a Skeleton-compatible theme for ttabs
2. Maintain the existing ttabs theme flexibility
3. Support light/dark mode theming automatically via Skeleton's color pairing system
4. Enable seamless integration with Skeleton UI's design language

## Proposed Implementation

### Theme Structure

We'll create a single `skeleton` theme that automatically works with Skeleton UI's theming system:

- The theme will utilize Skeleton's color pairing system (like `surface-50-950`) which automatically handles light/dark mode
- It will inherit styling from the parent Skeleton theme context, so it works with any Skeleton theme variant
- No manual light/dark mode detection or switching is needed as Skeleton handles this natively

### Convert Hardcoded Values to Variables

Several hardcoded values were identified in the components that should be converted to CSS variables for better theming:

```css
/* From TilePanel.svelte */
--ttabs-tab-close-margin: 8px;
--ttabs-tab-close-size: 16px;
--ttabs-tab-close-border-radius: 50%;

/* From TileRow.svelte */
--ttabs-row-resizer-size: 6px;
--ttabs-row-resizer-offset: -3px;

/* From TileColumn.svelte */
--ttabs-column-resizer-size: 6px;
--ttabs-column-resizer-offset: -3px;

/* From error component */
--ttabs-error-padding: 1rem;
--ttabs-error-border-radius: 4px;

/* From content container */
--ttabs-content-padding: 1rem;

/* From tab indicator */
--ttabs-tab-indicator-size: 3px;
--ttabs-tab-indicator-offset: 0;

/* From drag indicators */
--ttabs-drop-indicator-width: 4px;
--ttabs-drop-indicator-offset: -2px;

/* Tab transitions */
--ttabs-transition-duration: 0.1s;
--ttabs-transition-timing: ease;
```

### CSS Variables Integration

The existing ttabs CSS variables will be mapped to Skeleton's CSS variable system where appropriate:

```css
/* Base mappings from Skeleton to ttabs */
--ttabs-panel-bg: var(--color-surface-50-950);
--ttabs-tab-bar-bg: var(--color-surface-100-900);
--ttabs-active-tab-bg: var(--color-surface-50-950);
--ttabs-active-tab-indicator: var(--color-primary-500);
--ttabs-grid-bg: var(--color-surface-200-800);
--ttabs-grid-border: var(--default-border-width) solid var(--color-surface-300-700);
--ttabs-column-border: var(--default-border-width) solid var(--color-surface-300-700);

/* Text colors */
--ttabs-text-color: var(--color-surface-900-50);
--ttabs-text-color-secondary: var(--color-surface-700-300);
--ttabs-tab-text-color: var(--color-surface-700-300);
--ttabs-tab-active-text-color: var(--color-surface-900-50);

/* Content area */
--ttabs-content-bg: var(--color-surface-50-950);
--ttabs-content-border: var(--default-border-width) solid var(--color-surface-300-700);
--ttabs-content-text-color: var(--color-surface-900-50);
--ttabs-content-padding: var(--spacing);

/* Tab headers */
--ttabs-tab-header-padding: 0.5rem 1rem;
--ttabs-tab-header-border: var(--default-border-width) solid var(--color-surface-300-700);
--ttabs-tab-header-font-size: var(--text-sm);
--ttabs-tab-bar-border: var(--default-border-width) solid var(--color-surface-300-700);
--ttabs-tab-indicator-size: 3px;
--ttabs-tab-indicator-offset: 0;
--ttabs-transition-duration: 0.1s;
--ttabs-transition-timing: ease;

/* Controls */
--ttabs-close-button-color: var(--color-surface-500);
--ttabs-close-button-hover-color: var(--color-surface-700-300);
--ttabs-close-button-hover-bg: var(--color-surface-200-800);
--ttabs-show-close-button: flex; /* Default to showing close buttons */
--ttabs-tab-close-margin: 8px;
--ttabs-tab-close-size: 16px;
--ttabs-tab-close-border-radius: 50%;

/* Error styling */
--ttabs-error-bg: var(--color-error-100-900);
--ttabs-error-color: var(--color-error-500);
--ttabs-error-border: var(--default-border-width) solid var(--color-error-500);
--ttabs-error-padding: var(--spacing);
--ttabs-error-border-radius: var(--radius-container);

/* Empty state */
--ttabs-empty-state-color: var(--color-surface-500);

/* Utility elements */
--ttabs-resizer-hover-color: color-mix(in oklab, var(--color-primary-500) 30%, transparent);
--ttabs-drop-indicator-color: var(--color-primary-500);
--ttabs-drop-target-outline: 2px dashed color-mix(in oklab, var(--color-primary-500) 50%, transparent);
--ttabs-split-indicator-color: color-mix(in oklab, var(--color-primary-500) 10%, transparent);
--ttabs-row-resizer-size: 6px;
--ttabs-row-resizer-offset: -3px;
--ttabs-column-resizer-size: 6px;
--ttabs-column-resizer-offset: -3px;
--ttabs-drop-indicator-width: 4px;
--ttabs-drop-indicator-offset: -2px;

/* Border radius */
--ttabs-border-radius: var(--radius-container);
--ttabs-border-radius-sm: var(--radius-base);
```

### Component Updates

To leverage these new variables, we need to update several component styles:

```css
/* TilePanel.svelte */
.ttabs-tab-close {
  margin-left: var(--ttabs-tab-close-margin);
  width: var(--ttabs-tab-close-size);
  height: var(--ttabs-tab-close-size);
  border-radius: var(--ttabs-tab-close-border-radius);
}

.ttabs-tab-header-focused {
  box-shadow: inset 0 var(--ttabs-tab-indicator-size) 0 var(--ttabs-active-tab-indicator);
}

.ttabs-tab-header {
  transition: background-color var(--ttabs-transition-duration) var(--ttabs-transition-timing);
}

/* TileRow.svelte */
.row-resizer {
  bottom: var(--ttabs-row-resizer-offset);
  height: var(--ttabs-row-resizer-size);
}

/* TileColumn.svelte */
.column-resizer {
  right: var(--ttabs-column-resizer-offset);
  width: var(--ttabs-column-resizer-size);
}

/* Error component */
.ttabs-error {
  padding: var(--ttabs-error-padding);
  border-radius: var(--ttabs-error-border-radius);
}

/* Content container */
.content-container {
  padding: var(--ttabs-content-padding);
}

/* Drag indicators */
.ttabs-tab-header.drop-before::before {
  width: var(--ttabs-drop-indicator-width);
  left: var(--ttabs-drop-indicator-offset);
}

.ttabs-tab-header.drop-after::after {
  width: var(--ttabs-drop-indicator-width);
  right: var(--ttabs-drop-indicator-offset);
}

/* Apply border radius consistently */
.ttabs-panel, .ttabs-grid, .ttabs-error {
  border-radius: var(--ttabs-border-radius);
}

.ttabs-tab-header {
  border-top-left-radius: var(--ttabs-border-radius-sm);
  border-top-right-radius: var(--ttabs-border-radius-sm);
}
```

### Additional CSS Enhancements

Based on examination of the components, we'll also add these improvements:

```css
/* Improved focus state using Skeleton focus-ring pattern */
.ttabs-tab-header:focus-visible {
  @apply ring-2 ring-primary-500;
  outline: none;
}

/* Enhanced transitions for smoother UI */
.ttabs-panel, .ttabs-grid, .ttabs-column, .ttabs-row, .ttabs-tab-content {
  transition: all 0.2s ease-in-out;
}

/* Glass effect variant */
.ttabs-panel.preset-glass {
  background: color-mix(in oklab, var(--color-surface-50-950) 30%, transparent);
  box-shadow: 0 0px 30px color-mix(in oklab, var(--color-surface-50-950) 30%, transparent) inset;
  backdrop-filter: blur(16px);
}
```

### Skeleton Preset Classes

We'll also introduce optional preset classes that can be used with ttabs elements:

```css
.ttabs-panel-filled {
  @apply bg-surface-50-950 text-surface-900-50 shadow-md;
}

.ttabs-panel-outline {
  @apply bg-surface-50-950 border border-surface-300-700 text-surface-900-50;
}

.ttabs-tab-filled {
  @apply bg-primary-500 text-primary-contrast-500;
}

.ttabs-tab-tonal {
  @apply bg-primary-100-900 text-primary-900-100;
}

.ttabs-tab-outline {
  @apply border border-primary-500 text-primary-500;
}

.ttabs-ghost {
  @apply hover:bg-surface-100-900;
}
```

### Custom Component Implementation

We'll provide a custom close button component styled with Skeleton's design patterns:

```svelte
<!-- SkeletonCloseButton.svelte -->
<script lang="ts">
  export let tabId: string;
  export let ttabs: any;
  export let onClose: () => void;
</script>

<button
  class="btn-icon btn-icon-sm variant-ghost hover:variant-soft rounded-full"
  on:click={(e) => {
    e.stopPropagation();
    onClose();
  }}
  aria-label="Close tab"
>
  <span class="text-sm">✕</span>
</button>

<style>
  button {
    margin-left: 8px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
```

### Theme Variants

#### Base Skeleton Theme

The main implementation will closely match Skeleton's default styling with the ttabs structure.

The theme will automatically adapt to different Skeleton themes (Mona, Crimson, etc.) when used within those contexts.

## Sample Usage

### Basic Integration

To use the Skeleton theme with ttabs:

```javascript
import { Ttabs, TtabsRoot } from 'ttabs-svelte';
import { SKELETON_THEME } from 'ttabs-svelte/themes/skeleton';

const ttabs = new Ttabs({
  theme: SKELETON_THEME
});

// In your Svelte component
<div class="container">
  <TtabsRoot {ttabs} />
</div>
```

Since the theme uses Skeleton's color pairing system, it will automatically adapt to light/dark mode without additional configuration.

### With Custom Close Button

```javascript
import { Ttabs, TtabsRoot } from 'ttabs-svelte';
import { SKELETON_THEME } from 'ttabs-svelte/themes/skeleton';
import SkeletonCloseButton from 'ttabs-svelte/themes/skeleton/SkeletonCloseButton.svelte';

const ttabs = new Ttabs({
  theme: {
    ...SKELETON_THEME,
    components: {
      closeButton: SkeletonCloseButton
    }
  }
});
```

## Extended Examples

### Custom Component Styling

```javascript
// Register components with Skeleton-compatible styling
import MyComponent from './MyComponent.svelte';

ttabs.registerComponent('my-component', MyComponent, { 
  defaultProp: 'value',
  defaultClass: 'bg-surface-50-950 p-4 rounded-container'
});
```

### Preset Usage

```html
<script>
  import { Ttabs, TtabsRoot } from 'ttabs-svelte';
  import { SKELETON_THEME } from 'ttabs-svelte/themes/skeleton';
  
  const ttabs = new Ttabs({
    theme: {
      ...SKELETON_THEME,
      classes: {
        ...SKELETON_THEME.classes,
        panel: 'ttabs-panel-outline',
        'tab-header-active': 'ttabs-tab-tonal'
      }
    }
  });
</script>

<div class="container">
  <TtabsRoot {ttabs} />
</div>
```

### Glass Effect Panel

```html
<script>
  import { Ttabs, TtabsRoot } from 'ttabs-svelte';
  import { SKELETON_THEME } from 'ttabs-svelte/themes/skeleton';
  
  const ttabs = new Ttabs({
    theme: {
      ...SKELETON_THEME,
      classes: {
        ...SKELETON_THEME.classes,
        panel: 'ttabs-panel preset-glass'
      }
    }
  });
</script>

<div class="container">
  <TtabsRoot {ttabs} />
</div>
```

## UI Improvements

In addition to theme integration, we propose several UI improvements to align with Skeleton's design patterns:

1. Convert all hardcoded dimensions and values to CSS variables
2. Border radius for panels and tabs matching Skeleton's container radius (`var(--radius-container)`)
3. Better focus and hover states for tabs using Skeleton's focus ring pattern
4. Improved animations for tab transitions and panel resizing
5. Glass effect option for panels (using Skeleton's glass preset pattern)
6. Custom close button component that matches Skeleton's button styling
7. Semantic state styling (hover, focus, active) that matches Skeleton's patterns
8. Proper accessibility attributes including improved ARIA support

## Next Steps

1. Update the current components to use CSS variables instead of hardcoded values
2. Create implementation of the Skeleton theme
3. Test with various Skeleton preset themes to ensure proper variable inheritance
4. Add documentation and examples
5. Consider additional preset variants 