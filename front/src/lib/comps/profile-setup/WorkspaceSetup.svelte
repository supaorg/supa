<script lang="ts">
  import { ProgressRadial, Step, Stepper } from "@skeletonlabs/skeleton";
  import { client } from "$lib/tools/client";
  import { CheckCircle, Icon } from "svelte-hero-icons";
</script>

<div class="card p-4 max-w-3xl mx-auto mt-4">
  <h2 class="h2">Workspace</h2>
  <p class="mb-6">Where your conversations and other data is stored</p>

  <div>
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold">Create a workspace in iCloud</h3>
        <p class="text-sm">The content will be stored and synced in iCloud. This is the best option if use Supamind on iOS and MacOS.</p>
      </div>
      <button class="btn variant-filled-primary">Create</button>
    </div>
    <div class="flex items-center justify-between mt-4">
      <div>
        <h3 class="text-lg font-semibold">Choose an existing workspace</h3>
        <p class="text-sm">Choose a folder that contains your workspace files.</p>
      </div>
      <button class="btn variant-ringed-primary">Choose</button>
    </div>
    <div class="flex items-center justify-between mt-4">
      <div>
        <h3 class="text-lg font-semibold">Create a workspace in any folder</h3>
        <p class="text-sm">Create a new workspace. It could be local folder or a folder in a cloud service like Dropbox or Google Drive. Make sure the folder is empty.</p>
      </div>
      <button class="btn variant-ringed-primary">Choose</button>
    </div>
  </div>

</div>
