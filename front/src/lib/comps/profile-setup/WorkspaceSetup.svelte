<script lang="ts">
  import { ProgressRadial, Step, Stepper } from "@skeletonlabs/skeleton";
  import { client } from "$lib/tools/client";
  import { CheckCircle, Icon } from "svelte-hero-icons";
  import CenteredPage from "../CenteredPage.svelte";
</script>

<CenteredPage>
  <div class="card p-4 mt-4 space-y-4">
    <h2 class="h2">Let's setup a workspace</h2>
    <p class="mb-6">
      A 'workspace' is where your conversations and other data is stored. You
      can have multiple workspaces and switch between them. For example, one can
      be for work and another personal.
    </p>

    <div>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold">Create a workspace in iCloud</h3>
          <p class="text-sm">
            The content will be stored and synced in iCloud. This is the best
            option if you use Supamind on MacOS and eventually iOS. We will make
            an iOS app at some point.
          </p>
        </div>
        <button class="btn variant-filled-primary">Create</button>
      </div>
      <div class="flex items-center justify-between mt-4">
        <div>
          <h3 class="text-lg font-semibold">
            Create a workspace in any folder
          </h3>
          <p class="text-sm">
            Create a new workspace. It could be local folder or a folder in a
            cloud service like Dropbox or Google Drive. Make sure the folder is
            empty.
          </p>
        </div>
        <button class="btn variant-ringed-primary">Create</button>
      </div>
      <div class="flex items-center justify-between mt-4">
        <div>
          <h3 class="text-lg font-semibold">Choose an existing workspace</h3>
          <p class="text-sm">
            Choose a folder that contains your workspace files.
          </p>
        </div>
        <button class="btn variant-ringed-primary">Choose</button>
      </div>
    </div>
  </div>
</CenteredPage>
