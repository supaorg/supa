<script lang="ts">
  import { neoRouter } from "@back/index";
  import { readDir, BaseDirectory } from '@tauri-apps/plugin-fs';

  console.log(neoRouter);

  //sayHello();

  async function writeToFile() {
    const entries = await readDir('users', { baseDir: BaseDirectory.AppLocalData });
    console.log(entries);
  }
</script>

<button on:click={writeToFile}>Write to file</button>