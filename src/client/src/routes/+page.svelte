<script lang="ts">
  import { ReplicatedTree } from "@shared/spaces/replicatedTree";

  const tree = new ReplicatedTree("peer1");
  tree.new("root");
  tree.move("node1", "root");
  tree.setProperty("node1", "name", "Node 1");

  tree.new("node1");
  tree.setProperty("node2", "name", "Node 2");

  tree.new("node2");
  tree.setProperty("node3", "name", "Node 3");

  console.log(tree);
  /*
  import { readDir, exists, create, open, BaseDirectory } from '@tauri-apps/plugin-fs';

  async function writeToFile() {
    const entries = await readDir('', { baseDir: BaseDirectory.Home });
    console.log(entries);

    const hasDocs = await exists('Documents', { baseDir: BaseDirectory.Home });

    console.log(hasDocs);

    //const file = await open('Documents/hello-from-tauri.txt', { baseDir: BaseDirectory.Home, create: true });
    const file = await create('Documents/hello-from-tauri.txt', { baseDir: BaseDirectory.Home });

    const encoder = new TextEncoder();
    const data = encoder.encode("Hello from Tauri");
    await file.write(data);
  }*/
</script>

<!--<button on:click={writeToFile}>Write to file</button>-->

Hello from SupaCloud client
