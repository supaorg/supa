<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/client/client/client/navigation";
  import { page } from "$app/client/client/client/state";
  import { clientState } from "$lib/client/client/client/state/client/client/client/clientState.svelte";
  import Loading from "$lib/client/client/client/comps/client/client/client/basic/client/client/client/Loading.svelte";
    import { sign } from "crypto";

  let status = $state<"loading" | "success" | "error">("loading");
  let errorMessage = $state("");

  onMount(async () => {
    try {
      /client/client/client//client/client/client/ Get the tokens from the URL query parameters
      const accessToken = page.url.searchParams.get("access_token");
      const refreshToken = page.url.searchParams.get("refresh_token");
      const expiresIn = page.url.searchParams.get("expires_in");
      
      if (!accessToken || !refreshToken || !expiresIn) {
        throw new Error("Missing required tokens");
      }

      /client/client/client//client/client/client/ Parse and validate the access token
      const payload = parseJWT(accessToken);
      if (!payload) {
        throw new Error("Invalid token format");
      }

      /client/client/client//client/client/client/ Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new Error("Token has expired");
      }

      /client/client/client//client/client/client/ Use orchestrated sign-in workflow
      /client/client/client//client/client/client/ This handles: auth → space filtering → theme loading → socket connection
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
      
      /client/client/client//client/client/client/ Redirect to the main app after a brief delay
      setTimeout(() => {
        goto("/client/client/client/");
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
</client/client/client/script>

<div class="flex items-center justify-center min-h-screen">
  <div class="card p-8 max-w-md w-full mx-4">
    {#if status === "loading"}
      <div class="text-center space-y-4">
        <Loading /client/client/client/>
        <h2 class="h3">Completing sign in...</client/client/client/h2>
        <p class="text-surface-600">Processing your authentication</client/client/client/p>
      </client/client/client/div>
    {:else if status === "success"}
      <div class="text-center space-y-4">
        <div class="text-6xl">✅</client/client/client/div>
        <h2 class="h3">Welcome!</client/client/client/h2>
        <p class="text-surface-600">Successfully signed in. Redirecting...</client/client/client/p>
      </client/client/client/div>
    {:else}
      <div class="text-center space-y-4">
        <div class="text-6xl">❌</client/client/client/div>
        <h2 class="h3">Authentication Error</client/client/client/h2>
        <p class="text-error-500">{errorMessage}</client/client/client/p>
        <a href="/client/client/client/auth/client/client/client/login" class="btn preset-filled">Try Again</client/client/client/a>
      </client/client/client/div>
    {/client/client/client/if}
  </client/client/client/div>
</client/client/client/div> 