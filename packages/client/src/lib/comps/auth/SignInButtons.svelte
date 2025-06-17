<script lang="ts">
  const handleGoogleLogin = async () => {
    /*
    signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/auth-callback",
      },
    });
    if (error) console.error(error);
    */
  };

  const handleGithubLogin = async () => {
    /*
    signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: window.location.origin + "/auth-callback",
      },
    });
    if (error) console.error(error);
    */
  };

  const handleXLogin = async () => {
    /*
    signInWithOAuth({
      provider: "twitter",
      options: {
        redirectTo: window.location.origin + "/auth-callback",
      },
    });
    if (error) console.error(error);
    */
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
  class="btn bg-black text-white flex w-full mb-4"
  onclick={handleGithubLogin}
>
  <span class="bg-white p-1 rounded mr-2">
    <img src="/auth-providers-icons/github.svg" alt="Github" class="w-6 h-6" />
  </span>
  Continue with Github
</button>

<button
  type="button"
  class="btn bg-black text-white flex w-full mb-4"
  onclick={handleXLogin}
>
  <span class="bg-black p-1 rounded mr-2">
    <img src="/auth-providers-icons/x.svg" alt="X" class="w-6 h-6" />
  </span>
  Continue with X
</button>