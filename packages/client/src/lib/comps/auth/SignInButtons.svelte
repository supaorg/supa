<script lang="ts">
  import { API_BASE_URL } from "@supa/client/utils/api";

  let serverOnline = $state(true);
  let checkingServer = $state(true);

  // Check if server is online
  $effect(() => {
    checkServerHealth();
  });

  const checkServerHealth = async () => {
    try {
      checkingServer = true;
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      serverOnline = response.ok;
    } catch (error) {
      console.warn('Server health check failed:', error);
      serverOnline = false;
    } finally {
      checkingServer = false;
    }
  };

  const handleGoogleLogin = async () => {
    if (!serverOnline) return;
    
    try {
      // Redirect to the API server's Google OAuth endpoint
      // The server will handle the OAuth flow and redirect back with a token
      window.location.href = `${API_BASE_URL}/auth/login/google`;
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const handleGithubLogin = async () => {
    if (!serverOnline) return;
    // TODO: Implement GitHub OAuth
    console.log('GitHub OAuth not implemented yet');
  };

  const handleXLogin = async () => {
    if (!serverOnline) return;
    // TODO: Implement X/Twitter OAuth  
    console.log('X OAuth not implemented yet');
  };
</script>

{#if !serverOnline}
  <div class="text-center p-4 mb-4">
    <div class="bg-warning-100-900 border border-warning-300-700 rounded-lg p-4">
      <p class="font-medium mb-2">Servers are offline at the moment</p>
      <p class="text-sm">Go with local first if you want to test</p>
    </div>
  </div>
{/if}

<button
  type="button"
  class="btn flex w-full bg-blue-600 text-white mb-4"
  class:opacity-50={!serverOnline}
  class:cursor-not-allowed={!serverOnline}
  onclick={handleGoogleLogin}
  disabled={!serverOnline}
>
  <span class="bg-white p-1 rounded mr-2">
    <img src="/auth-providers-icons/google.svg" alt="Google" class="w-6 h-6" />
  </span>
  Continue with Google
</button>

<button
  type="button"
  class="btn bg-black text-white flex w-full mb-4"
  class:opacity-50={!serverOnline}
  class:cursor-not-allowed={!serverOnline}
  onclick={handleGithubLogin}
  disabled={!serverOnline}
>
  <span class="bg-white p-1 rounded mr-2">
    <img src="/auth-providers-icons/github.svg" alt="Github" class="w-6 h-6" />
  </span>
  Continue with Github (Coming Soon)
</button>

<button
  type="button"
  class="btn bg-black text-white flex w-full mb-4"
  class:opacity-50={!serverOnline}
  class:cursor-not-allowed={!serverOnline}
  onclick={handleXLogin}
  disabled={!serverOnline}
>
  <span class="bg-black p-1 rounded mr-2">
    <img src="/auth-providers-icons/x.svg" alt="X" class="w-6 h-6" />
  </span>
  Continue with X (Coming Soon)
</button>