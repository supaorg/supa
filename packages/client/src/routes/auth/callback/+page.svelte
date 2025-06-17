<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { authStore } from "$lib/stores/auth.svelte";
  import Loading from "$lib/comps/basic/Loading.svelte";

  let status = $state<"loading" | "success" | "error">("loading");
  let errorMessage = $state("");

  onMount(async () => {
    try {
      // Get the token from the URL query parameters
      const token = page.url.searchParams.get("token");
      
      if (!token) {
        throw new Error("No token found in URL");
      }

      // Parse and validate the JWT token
      const payload = parseJWT(token);
      if (!payload) {
        throw new Error("Invalid token format");
      }

      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new Error("Token has expired");
      }

      // Store the token and user info
      await authStore.setAuth(token, {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        avatarUrl: payload.avatar_url,
      });

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
    {:else if status === "error"}
      <div class="text-center space-y-4">
        <div class="text-6xl">❌</div>
        <h2 class="h3">Authentication Error</h2>
        <p class="text-error-500">{errorMessage}</p>
        <a href="/" class="btn preset-filled">Go Home</a>
      </div>
    {/if}
  </div>
</div> 