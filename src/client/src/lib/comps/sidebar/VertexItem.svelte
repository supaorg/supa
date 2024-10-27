<script lang="ts">
  let { id } = $props();

  let classActive = "";

  //$: classActive = active ? "bg-primary-active-token" : "";
</script>

<span
  class={`flex rounded-token hover:bg-surface-100-800-token ${classActive}`}
>
  <a href={`/?t=${id}`} class="flex-grow py-2 px-4 truncate">
    <span>{"New conversation"}</span>
  </a>
  <!--<ThreadOptionsPopup threadId={thread.id} showOpenButton={active} />-->
</span>
