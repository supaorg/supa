<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { clientState } from "$lib/clientState.svelte";
  import Loading from "$lib/comps/basic/Loading.svelte";

  let status = $state<"loading" | "success" | "error">("loading");
  let errorMessage = $state("");

  onMount(async () => {
    try {
      // Get the tokens from the URL query parameters
      const accessToken = page.url.searchParams.get("access_token");
      const refreshToken = page.url.searchParams.get("refresh_token");
      const expiresIn = page.url.searchParams.get("expires_in");
      
      if (!accessToken || !refreshToken || !expiresIn) {
        throw new Error("Missing required tokens");
      }

      // Parse and validate the access token
      const payload = parseJWT(accessToken);
      if (!payload) {
        throw new Error("Invalid token format");
      }

      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new Error("Token has expired");
      }

      // Use orchestrated sign-in workflow
      // This handles: auth → space filtering → theme loading → socket connection
      await clientState.signIn(
        {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: parseInt(expiresIn)
        },
        {
          id: payload.sub,
          email: payload.email,
          name: payload.name
        }
      );

      status = "success";
      
      // Redirect to the main app after a brief delay
      setTimeout(() => {
        goto("/");
      }, 1000);
      
    } catch (error) {
      console.error("Auth callback error:", error);
      status = "error";
      errorMessage = error instanceof Error ? error.message : "Authentication failed";
    }
  });

  function parseJWT(token: string) {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (error) {
      return null;
    }
  }
</script>

<div class="flex items-center justify-center min-h-screen">
  <div class="card p-8 max-w-md w-full mx-4">
    {#if status === "loading"}
      <div class="text-center space-y-4">
        <Loading />
        <h2 class="h3">Completing sign in...</h2>
        <p class="text-surface-600">Processing your authentication</p>
      </div>
    {:else if status === "success"}
      <div class="text-center space-y-4">
        <div class="text-6xl">✅</div>
        <h2 class="h3">Welcome!</h2>
        <p class="text-surface-600">Successfully signed in. Redirecting...</p>
      </div>
    {:else}
      <div class="text-center space-y-4">
        <div class="text-6xl">❌</div>
        <h2 class="h3">Authentication Error</h2>
        <p class="text-error-500">{errorMessage}</p>
        <a href="/auth/login" class="btn preset-filled">Try Again</a>
      </div>
    {/if}
  </div>
</div> 