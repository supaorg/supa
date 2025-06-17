<script lang="ts">
  // API server configuration
  const API_BASE_URL = 'http://localhost:3131'; // TODO: Make this configurable

  const handleGoogleLogin = async () => {
    try {
      // Redirect to the API server's Google OAuth endpoint
      // The server will handle the OAuth flow and redirect back with a token
      window.location.href = `${API_BASE_URL}/auth/login/google`;
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const handleGithubLogin = async () => {
    // TODO: Implement GitHub OAuth
    console.log('GitHub OAuth not implemented yet');
  };

  const handleXLogin = async () => {
    // TODO: Implement X/Twitter OAuth  
    console.log('X OAuth not implemented yet');
  };
</script>

<button
  type="button"
  class="btn flex w-full bg-blue-600 text-white mb-4"
  onclick={handleGoogleLogin}
>
  <span class="bg-white p-1 rounded mr-2">
    <img src="/auth-providers-icons/google.svg" alt="Google" class="w-6 h-6" />
  </span>
  Continue with Google
</button>

<button
  type="button"
  class="btn bg-black text-white flex w-full mb-4 opacity-50 cursor-not-allowed"
  onclick={handleGithubLogin}
  disabled
>
  <span class="bg-white p-1 rounded mr-2">
    <img src="/auth-providers-icons/github.svg" alt="Github" class="w-6 h-6" />
  </span>
  Continue with Github (Coming Soon)
</button>

<button
  type="button"
  class="btn bg-black text-white flex w-full mb-4 opacity-50 cursor-not-allowed"
  onclick={handleXLogin}
  disabled
>
  <span class="bg-black p-1 rounded mr-2">
    <img src="/auth-providers-icons/x.svg" alt="X" class="w-6 h-6" />
  </span>
  Continue with X (Coming Soon)
</button>