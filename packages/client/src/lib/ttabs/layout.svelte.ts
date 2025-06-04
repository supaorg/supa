import ChatAppLoader from "$lib/comps/apps/ChatAppLoader.svelte";
import Sidebar from "$lib/comps/sidebar/Sidebar.svelte";
import SidebarToggle from "$lib/comps/sidebar/SidebarToggle.svelte";
import {
  createTtabs,
  type TtabsTheme,
  type LayoutValidator,
  LayoutValidationError,
  type TTabs,
} from "ttabs-svelte";
import { SKELETON_THEME } from "$lib/ttabs/themes/skeleton";
import TabCloseButton from "$lib/ttabs/components/TabCloseButton.svelte";
import DefaultAppPage from "$lib/comps/apps/DefaultAppPage.svelte";

/**
 * SidebarValidator ensures that the layout has a sidebar column.
 * It doesn't matter if the sidebar has width 0, it just needs to exist.
 * @param ttabs The ttabs instance to validate
 * @returns true if layout is valid, throws LayoutValidationError otherwise
 */
const sidebarValidator: LayoutValidator = (ttabs: TTabs): boolean => {
  const tiles = ttabs.getTiles();
  const rootGridId = ttabs.rootGridId as string;
  const rootGrid = tiles[rootGridId];

  // Check that root grid has only 1 row
  if (!rootGrid || rootGrid.type !== 'grid' || rootGrid.rows.length !== 1) {
    throw new LayoutValidationError(
      "Root grid must have exactly one row",
      "INVALID_ROOT_GRID"
    );
  }

  // Get the row and check its columns
  const rowId = rootGrid.rows[0];
  const row = tiles[rowId];

  if (!row || row.type !== 'row' || row.columns.length < 1) {
    throw new LayoutValidationError(
      "Root grid's row must have at least one column",
      "INVALID_ROW_STRUCTURE"
    );
  }

  // Find sidebar components
  const sidebarTiles = Object.values(tiles).filter(tile =>
    tile.type === 'content' && tile.componentId === 'sidebar'
  );

  // Check that there is exactly one sidebar
  if (sidebarTiles.length === 0) {
    throw new LayoutValidationError(
      "Layout must include a sidebar component",
      "MISSING_SIDEBAR"
    );
  }

  if (sidebarTiles.length > 1) {
    throw new LayoutValidationError(
      "Layout must include only one sidebar component",
      "MULTIPLE_SIDEBARS"
    );
  }

  // Check that sidebar is in a column
  const sidebarTile = sidebarTiles[0];
  if (!sidebarTile.parent) {
    throw new LayoutValidationError(
      "Sidebar must have a parent column",
      "INVALID_SIDEBAR_PARENT"
    );
  }

  const sidebarParent = tiles[sidebarTile.parent];
  if (!sidebarParent || sidebarParent.type !== 'column') {
    throw new LayoutValidationError(
      "Sidebar must be placed in a column",
      "INVALID_SIDEBAR_PARENT"
    );
  }

  // Check that sidebar is in the first column of the row
  if (row.columns[0] !== sidebarParent.id) {
    throw new LayoutValidationError(
      "Sidebar must be in the first column of the root row",
      "SIDEBAR_NOT_FIRST_COLUMN"
    );
  }

  return true;
};

export const ttabs = createTtabs({
  theme: {
    ...SKELETON_THEME,
    components: {
      closeButton: TabCloseButton
    } as TtabsTheme['components']
  },
  validators: [sidebarValidator],
  defaultLayoutCreator: setupDefault,
  setupFromScratch: findAndUpdateLayoutRefs,
  defaultComponentIdForEmptyTiles: 'noTabsContent'
});

ttabs.registerComponent('sidebar', Sidebar);
ttabs.registerComponent('chat', ChatAppLoader);
ttabs.registerComponent('sidebarToggle', SidebarToggle);
ttabs.registerComponent('noTabsContent', DefaultAppPage);

type LayoutRefs = {
  contentGrid: string | undefined,
  sidebarColumn: string | undefined
}

export const layoutRefs: LayoutRefs = $state({
  contentGrid: undefined,
  sidebarColumn: undefined
});

export const sidebar = $state({
  isOpen: true,
  widthWhenOpen: 300,

  toggle() {
    this.isOpen = !this.isOpen;
    this._updateLayout();
  },

  open() {
    this.isOpen = true;
    this._updateLayout();
  },

  close() {
    this.isOpen = false;
    this._updateLayout();
  },

  _updateLayout() {
    if (!layoutRefs.sidebarColumn) return;

    ttabs.updateTile(layoutRefs.sidebarColumn, {
      width: {
        value: this.isOpen ? this.widthWhenOpen : 0,
        unit: "px"
      },
    });
  }
});

ttabs.subscribeDebounced(() => {
  findAndUpdateLayoutRefs();
});

function updateHoverSidebarState() {
  try {
    if (layoutRefs.sidebarColumn) {
      const sidebarColumn = ttabs.getColumn(layoutRefs.sidebarColumn);
      if (sidebarColumn) {
        sidebar.isOpen = (sidebarColumn.width?.value || 0) > 50;

        if (sidebar.isOpen) {
          sidebar.widthWhenOpen = Math.max(50, sidebarColumn.width?.value || 300);
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
}

export function setupLayout(layoutJson?: string) {
  if (!layoutJson) {
    ttabs.resetToDefaultLayout();
    return;
  }

  ttabs.deserializeLayout(layoutJson);
}

/**
 * Helper function to find the top-left panel in the content area
 * @returns The ID of the top-left panel, or undefined if not found
 */
function findTopLeftPanelId(): string | undefined {
  try {
    if (!layoutRefs.contentGrid) return undefined;

    // Recursively find the top-left panel in a grid
    const findTopLeftPanelInGrid = (gridId: string): string | undefined => {
      try {
        const grid = ttabs.getGrid(gridId);
        if (!grid || grid.rows.length === 0) return undefined;

        // Get the first row
        const firstRowId = grid.rows[0];
        const firstRow = ttabs.getRow(firstRowId);
        if (!firstRow || firstRow.columns.length === 0) return undefined;

        // Get the first column
        const firstColId = firstRow.columns[0];
        const firstCol = ttabs.getColumn(firstColId);
        if (!firstCol || !firstCol.child) return undefined;

        // Get the child tile
        const childId = firstCol.child;
        const child = ttabs.getTile(childId);

        if (!child) return undefined;

        // If child is a panel, we found our top-left panel
        if (child.type === 'panel') {
          return childId;
        }
        // If child is a grid, recursively search within it
        else if (child.type === 'grid') {
          return findTopLeftPanelInGrid(childId);
        }

        return undefined;
      } catch (error) {
        console.error(`Error finding top-left panel in grid ${gridId}:`, error);
        return undefined;
      }
    };

    return findTopLeftPanelInGrid(layoutRefs.contentGrid);
  } catch (e) {
    console.error('Error in findTopLeftPanelId:', e);
    return undefined;
  }
}

/**
 * Updates the visibility of the sidebar toggle button in all panels
 * The toggle button is only visible in the top-left panel when the sidebar is closed
 */
function updateSidebarToggleVisibility() {
  const allPanels = Object.values(ttabs.getTiles())
    .filter((tile) => tile.type === 'panel');

  const firstPanelId = findTopLeftPanelId();

  allPanels.forEach(panel => {
    if (panel.id === firstPanelId && !sidebar.isOpen) {
      panel.leftComponents = [{ componentId: 'sidebarToggle' }];
    } else {
      panel.leftComponents = [];
    }
  });

  for (const panel of allPanels) {
    ttabs.updateTile(panel.id, panel);
  }
}

/**
 * Find and update layout references after a reset to default layout
 * This ensures layoutRefs are always in sync with the actual layout
 */
function findAndUpdateLayoutRefs() {
  // Find the sidebar column
  const tiles = ttabs.getTiles();

  // Find sidebar component
  const sidebarTiles = Object.values(tiles).filter(tile =>
    tile.type === 'content' && tile.componentId === 'sidebar'
  );

  if (sidebarTiles.length > 0) {
    const sidebarTile = sidebarTiles[0];
    if (sidebarTile.parent) {
      // Update the sidebar column reference
      layoutRefs.sidebarColumn = sidebarTile.parent;

      // Find the content grid (sibling column's child grid)
      const sidebarParent = tiles[sidebarTile.parent]?.parent;
      if (sidebarParent) {
        const row = tiles[sidebarParent];
        if (row && row.type === 'row') {
          // Find the other column in this row (not the sidebar column)
          const otherColumns = row.columns.filter(colId => colId !== sidebarTile.parent);
          if (otherColumns.length > 0) {
            const contentColumn = tiles[otherColumns[0]];
            if (contentColumn && contentColumn.type === 'column' && contentColumn.child) {
              const childTile = tiles[contentColumn.child];
              if (childTile && childTile.type === 'grid') {
                // Found the content grid
                layoutRefs.contentGrid = childTile.id;
              }
            }
          }
        }
      }
    }
  }

  updateHoverSidebarState();

  updateSidebarToggleVisibility();
}

/**
 * Creates a default layout with a sidebar and content area.
 * This function is used as the defaultLayoutCreator for ttabs,
 * so it will be called automatically when layout validation fails or when no layout is provided.
 */
export function setupDefault(tt: TTabs) {
  tt.resetTiles();
  const root = tt.addGrid();
  const row = tt.addRow(root);
  layoutRefs.sidebarColumn = tt.addColumn(row, "300px");
  tt.setComponent(layoutRefs.sidebarColumn, 'sidebar');
  const parentColumn = tt.addColumn(row);
  layoutRefs.contentGrid = tt.addGrid(parentColumn);
  tt.updateTile(layoutRefs.contentGrid, { dontClean: true });
  const newRow = tt.addRow(layoutRefs.contentGrid);
  const newColumn = tt.addColumn(newRow);
  tt.addPanel(newColumn);
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

  if (!layoutRefs.contentGrid) {
    // Find the first non root grid
    const grids = Object.values(ttabs.getTiles()).filter(tile => tile.type === 'grid' && !tile.parent);
    if (grids.length === 0) {
      console.error("No non root grid found");
      return;
    }
    layoutRefs.contentGrid = grids[0].id;
  }

  const grid = ttabs.getGrid(layoutRefs.contentGrid);
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