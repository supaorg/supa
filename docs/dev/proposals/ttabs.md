# TTabs Implementation Proposal

## Overview

This proposal outlines the transition from URL-based navigation for app trees (chats) to using the ttabs-svelte library for a more flexible tab-based layout system. This change will allow users to have multiple conversations open simultaneously in tabs and provide a more intuitive workspace experience.

## Current Implementation

Currently, our app:
- Uses URL parameters (`?t={appTreeId}`) to navigate between different chat trees
- Only allows viewing one conversation at a time
- Renders chat components within a fixed layout structure

## Proposed Changes

### Core Components

1. **TTabs Integration**
   - Replace the current fixed layout with ttabs-svelte's flexible grid system
   - Maintain sidebar as a fixed column component
   - Use tabs for individual chat conversations

2. **Chat Opening Mechanism**
   - Instead of URL navigation, clicking on a conversation in the sidebar will:
     - Check if the conversation is already open in a tab
     - If open: Focus that tab
     - If not open: Create a new tab with that conversation

3. **State Persistence**
   - Use LocalStorageAdapter to save and restore layout configuration
   - Persist open conversations across sessions

## Technical Implementation

```typescript
// Core component registration
ttabs.registerComponent('sidebar', Sidebar);
ttabs.registerComponent('chat', ChatApp);

// Chat opening function
function openChatInTab(appTreeId: string, name: string) {
  // Check if tab with this appTreeId already exists
  const existingTabId = findTabWithAppTreeId(appTreeId);
  
  if (existingTabId) {
    // Focus existing tab
    ttabs.setFocusedActiveTab(existingTabId);
  } else {
    // Create new tab in active panel
    const tabId = ttabs.addTab(ttabs.getActivePanel(), name || "New conversation");
    ttabs.setComponent(tabId, 'chat', { appTreeId });
    ttabs.setFocusedActiveTab(tabId);
  }
}

// Create function to find tabs by appTreeId in component props
function findTabWithAppTreeId(appTreeId: string): string | undefined {
  // Traverse tabs and check component props
  // Return tab ID if found
}
```

## Changes to Existing Components

1. **VertexItem.svelte**
   - Update click handler to call `openChatInTab` instead of using URL navigation
   - Remove URL-based active state detection
   - Add method to check if item is open in any tab

2. **App.svelte**
   - Create default ttabs layout with sidebar and chat area
   - Set up persistence with LocalStorageAdapter
   - Remove URL-based navigation logic

3. **ChatApp.svelte**
   - Update to receive appTreeId as a prop instead of from URL
   - Manage component lifecycle within tab context

## User Experience Improvements

- Multiple conversations can be open simultaneously
- Ability to rearrange and resize conversation panels
- Split-view option for comparing conversations
- Drag-and-drop tabs between panels

## Migration Strategy

We will implement a direct cutover approach:
1. Fully implement the ttabs layout system
2. Remove all URL-based navigation code completely
3. Deploy the changes as a single update

This approach will be faster to implement and maintain as we won't need to support both navigation methods simultaneously.

## Next Steps

- Implement core ttabs layout structure
- Develop tab component with chat integration
- Create persistence layer
- Remove URL-based navigation completely
- Update sidebar interaction with tab system
- Add tab management features (close, duplicate, etc.) 