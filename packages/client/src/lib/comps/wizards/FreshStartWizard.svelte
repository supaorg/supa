<script lang="ts">
  import CenteredPage from "$lib/comps/basic/CenteredPage.svelte";
  function handleSignIn() {
    // TODO: Implement sign in functionality
  }

  function handleAnonymous() {
    // TODO: Implement anonymous access
  }
</script>

<CenteredPage>
  <div class="card p-8 mt-4 space-y-6">
    <div class="space-y-4">
      <h2 class="h2">Welcome to t69.chat</h2>
      <p class="text-lg">
        This is an open-source alternative to <a class="anchor" href="https://t3.chat">t3.chat</a>, a project for a <a class="anchor"
          href="https://cloneathon.t3.chat/"
          >hackathon orginized by Theo the youtuber</a
        >. Here's the <a class="anchor" href="https://github.com/mitkury/t69">source on
        GitHub</a> (start pls).
      </p>
    </div>

    <div class="flex flex-col gap-4 pt-4">
      <button class="btn preset-filled-primary-500" on:click={handleAnonymous}>
        Go anon, sign in later
      </button>
      <button class="btn preset-outlined-surface-500" on:click={handleSignIn}>
        Sign in/up
      </button>
    </div>
  </div>
</CenteredPage>
