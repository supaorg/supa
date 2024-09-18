<script lang="ts">
  const os = "macos";

  // @TODO: handle for windows and linux
</script>

<div class="flex items-center justify-center h-full">
  <div>
    <h1 class="text-2xl font-bold">Need access to the folder</h1>
    <p class="mt-4">
      {#if os === "macos"}
      To allow file system access:
      <ol class="decimal-list mb-4">
        <li>Open 'Settings'.</li>
        <li>Navigate to 'Privacy'.</li>
        <li>Select 'Files and Folders'.</li>
        <li>Find and enable permission for Supamind app.</li>
      </ol>
      Re-launch the app after giving the permission.
      {:else if os === "windows"}
        @TODO: handle for windows
      {:else if os === "linux"}
        @TODO: handle for linux
      {/if}
    </p>
  </div>
</div>
