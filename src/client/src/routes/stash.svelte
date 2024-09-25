<script lang="ts">
  import {
    readDir,
    exists,
    create,
    open,
    BaseDirectory,
  } from "@tauri-apps/plugin-fs";

  async function writeToFile() {
    const entries = await readDir("", { baseDir: BaseDirectory.Home });
    console.log(entries);

    const hasDocs = await exists("Documents", { baseDir: BaseDirectory.Home });

    console.log(hasDocs);

    //const file = await open('Documents/hello-from-tauri.txt', { baseDir: BaseDirectory.Home, create: true });
    const file = await create("Documents/hello-from-tauri.txt", {
      baseDir: BaseDirectory.Home,
    });

    const encoder = new TextEncoder();
    const data = encoder.encode("Hello from Tauri");
    await file.write(data);
  }
</script>
