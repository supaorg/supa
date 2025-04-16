import ChatAppLoader from "$lib/comps/apps/ChatAppLoader.svelte";
import Sidebar from "$lib/comps/sidebar/Sidebar.svelte";
import { currentSpaceIdStore } from "$lib/spaces/spaceStore";
import { createTtabs } from "ttabs-svelte";
import { SKELETON_THEME } from "$lib/ttabs/themes/skeleton";

export const ttabs = createTtabs({
  theme: {
    ...SKELETON_THEME
  }
});

ttabs.registerComponent('sidebar', Sidebar);
ttabs.registerComponent('chat', ChatAppLoader);

let contentGrid: string | undefined;

function setupTtabs() {
  ttabs.resetState();
  const root = ttabs.rootGridId as string;
  const row = ttabs.addRow(root, 100);

  const sidebarColumn = ttabs.addColumn(row, 20); // allow to add with in pixels "200px"
  ttabs.setComponent(sidebarColumn, 'sidebar'); // should I have the same function for tabs and columns?

  const parentColumn = ttabs.addColumn(row, 80);
  contentGrid = ttabs.addGrid(parentColumn);
  ttabs.updateTile(contentGrid, { dontClean: true });
  const newRow = ttabs.addRow(contentGrid, 100);
  const newColumn = ttabs.addColumn(newRow, 100);
  const panel = ttabs.addPanel(newColumn);
  const tab = ttabs.addTab(panel, "New Tab");
  const tab2 = ttabs.addTab(panel, "New Tab 2");

  ttabs.setFocusedActiveTab(tab);
}

export function openChatTab(treeId: string, name: string) {
  const grid = ttabs.getGrid(contentGrid!);
  const tab = ttabs.addTab(grid.id, name);
  ttabs.setComponent(tab, 'chat', { treeId });
  ttabs.setFocusedActiveTab(tab);
}

currentSpaceIdStore.subscribe((spaceId) => {
  console.log("Setup ttabs for space", spaceId);
  setupTtabs();
});
