<script lang="ts">
  export let href: string;

  let newTab = false;

  if (href.startsWith("http")) {
    newTab = true;
  }
</script>

<a {href} class="anchor" target={newTab ? "_blank" : "_self"}><slot></slot></a>
