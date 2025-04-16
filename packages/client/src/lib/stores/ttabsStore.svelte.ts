import ChatAppLoader from "$lib/comps/apps/ChatAppLoader.svelte";
import Sidebar from "$lib/comps/sidebar/Sidebar.svelte";
import { currentSpaceIdStore } from "$lib/spaces/spaceStore";
import { createTtabs } from "ttabs-svelte";

export const ttabs = createTtabs();

let mainColumnId: string | undefined;

ttabs.registerComponent('sidebar', Sidebar);
ttabs.registerComponent('chat', ChatAppLoader);

function setupTtabs() {
  ttabs.resetState();
  const root = ttabs.rootGridId as string;
  const row = ttabs.addRow(root, 100);

  const sidebarColumn = ttabs.addColumn(row, 20); // allow to add with in pixels "200px"
  ttabs.setComponent(sidebarColumn, 'sidebar'); // should I have the same function for tabs and columns?

  mainColumnId = ttabs.addColumn(row, 80);
  const panel = ttabs.addPanel(mainColumnId);
  const tab = ttabs.addTab(panel, "New Tab");
  const tab2 = ttabs.addTab(panel, "New Tab 2");

  ttabs.setFocusedActiveTab(tab);
}

export function openChatTab(treeId: string, name: string) {
  const mainColumn = ttabs.getColumn(mainColumnId!);
  const panel = ttabs.getPanel(mainColumn.child);
  const tab = ttabs.addTab(panel.id, name);
  ttabs.setComponent(tab, 'chat', { treeId });
  ttabs.setFocusedActiveTab(tab);
}

currentSpaceIdStore.subscribe((spaceId) => {
  console.log("Setup ttabs for space", spaceId);
  setupTtabs();
});
