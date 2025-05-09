import ChatAppLoader from "$lib/comps/apps/ChatAppLoader.svelte";
import Sidebar from "$lib/comps/sidebar/Sidebar.svelte";
import { createTtabs, type TtabsTheme, type Tile } from "ttabs-svelte";
import { SKELETON_THEME } from "$lib/ttabs/themes/skeleton";
import TabCloseButton from "$lib/ttabs/components/TabCloseButton.svelte";

export const ttabs = createTtabs({
  theme: {
    ...SKELETON_THEME,
    components: {
      closeButton: TabCloseButton
    } as TtabsTheme['components']
  }
});

ttabs.registerComponent('sidebar', Sidebar);
ttabs.registerComponent('chat', ChatAppLoader);

let contentGrid: string | undefined;

export let sidebarColumn: string | undefined;

export function setupLayout(layoutJson?: string) {
  if (!layoutJson) {
    setupDefault();
    return;
  }
  
  if (!tryToSetupFromJson(layoutJson)) {
    setupDefault();
  }
}

/**
 * Validates a layout JSON string to ensure it meets the minimum requirements and
 * sets up the ttabs layout if valid:
 * - Must have exactly one root grid
 * - Must have a sidebar component
 * - Must have at least one tab with content
 * 
 * @param layoutJson The layout JSON string to validate and apply
 * @returns True if the layout is valid and applied, false otherwise
 */
function tryToSetupFromJson(layoutJson: string): boolean {
  try {
    let tiles: Tile[] = [];
    let parsedLayout: any;
    
    // Try to parse as new format first (with metadata)
    try {
      parsedLayout = JSON.parse(layoutJson);
      if (parsedLayout && typeof parsedLayout === 'object' && 'tiles' in parsedLayout && Array.isArray(parsedLayout.tiles)) {
        tiles = parsedLayout.tiles;
      }
    } catch (e) {
      console.error('Failed to parse layout JSON:', e);
      return false;
    }
    
    if (tiles.length === 0) {
      console.error('No tiles found in layout');
      return false;
    }
    
    // Check for exactly one root grid
    const rootGrids = tiles.filter(tile => 
      tile.type === 'grid' && !tile.parent
    );
    
    if (rootGrids.length !== 1) {
      console.error(`Invalid number of root grids: ${rootGrids.length}, expected 1`);
      return false;
    }
    
    // Check for exactly one sidebar component
    const sidebarTiles = tiles.filter(tile => 
      tile.type === 'content' && tile.componentId === 'sidebar'
    );
    
    if (sidebarTiles.length !== 1) {
      console.error('Invalid number of sidebar components: ' + sidebarTiles.length + ', expected 1');
      return false;
    }
    
    // Check for at least one tab with content
    const hasTab = tiles.some(tile => tile.type === 'tab');
    
    if (!hasTab) {
      console.error('No tabs found in layout');
      return false;
    }
    
    // Verify that at least one tab has associated content
    const tabsWithContent = tiles.filter(tile => 
      tile.type === 'tab' && 
      tiles.some(contentTile => 
        contentTile.type === 'content' && 
        contentTile.parent === tile.id
      )
    );
    
    if (tabsWithContent.length === 0) {
      console.error('No tabs with content found in layout');
      return false;
    }
    
    // All validation passed, now apply the layout and set references 
    // for the content grid and sidebar column
    
    // Find the main content grid and sidebar column
    contentGrid = rootGrids[0].id;
    
    const sidebarParentTile = tiles.find(tile => tile.id === sidebarTiles[0].parent);
    if (sidebarParentTile && sidebarParentTile.type === 'column') {
      sidebarColumn = sidebarParentTile.id;
    } else {
      console.error('Sidebar parent tile not found or not a column');
      return false;
    }

    let activePanel = parsedLayout.metadata?.activePanel;
    let focusedActiveTab = parsedLayout.metadata?.focusedActiveTab;

    // Now setup ttabs
    ttabs.setup(tiles, { activePanel, focusedActiveTab })
    
    return true;
  } catch (e) {
    console.error('Error validating or applying layout:', e);
    return false;
  }
}

export function setupDefault() {
  ttabs.resetTiles();
  ttabs.rootGridId = ttabs.addGrid();
  const root = ttabs.rootGridId as string;
  const row = ttabs.addRow(root);
  sidebarColumn = ttabs.addColumn(row, "300px");
  ttabs.setComponent(sidebarColumn, 'sidebar');
  const parentColumn = ttabs.addColumn(row);
  contentGrid = ttabs.addGrid(parentColumn);
  ttabs.updateTile(contentGrid, { dontClean: true });
  const newRow = ttabs.addRow(contentGrid);
  const newColumn = ttabs.addColumn(newRow);
  ttabs.addPanel(newColumn);
}

function findTabByTreeId(treeId: string): string | undefined {
  // Search through all content tiles to find one with the matching treeId
  for (const tileId in ttabs.tiles) {
    const tile = ttabs.tiles[tileId];
    if (tile.type === 'tab') {
      const content = ttabs.getTabContent(tile.id);
      if (
        content?.componentId === 'chat' && 
        content?.data?.componentProps?.treeId === treeId
      ) {
        return tile.id;
      }
    }
  }
  return undefined;
}

export function openChatTab(treeId: string, name: string) {
  // First, check if a tab with this treeId already exists
  const existingTabId = findTabByTreeId(treeId);
  if (existingTabId) {
    // If tab exists, just activate it
    ttabs.setFocusedActiveTab(existingTabId);
    return;
  }
  
  const grid = ttabs.getGrid(contentGrid!);
  let tab: string;
  
  // Check for a lazy tab and if it exists, update it
  const lazyTabs = ttabs.getLazyTabs(grid.id);
  
  if (lazyTabs.length > 0) {
    // Reuse the first lazy tab we found
    const lazyTab = lazyTabs[0];
    tab = lazyTab.id;
    
    // Update the tab name
    ttabs.updateTile(tab, { 
      name
    });
  } else {
    // No lazy tabs found, create a new one
    tab = ttabs.addTab(grid.id, name, true, true);
  }
  
  // Set the component for the tab
  ttabs.setComponent(tab, 'chat', { treeId });
  ttabs.setFocusedActiveTab(tab);
}