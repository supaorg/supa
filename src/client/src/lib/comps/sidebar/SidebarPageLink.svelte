<script lang="ts">
  import { page } from "$app/state";

  let { href, children } = $props();
  
  let isActive = $derived(page.url.pathname === href);
</script>

<a 
  {href} 
  class={`flex-grow py-2 px-2 truncate flex rounded-token ${
    isActive ? "bg-primary-500" : "hover:bg-surface-100-900"
  }`}
>
  {@render children()}
</a>