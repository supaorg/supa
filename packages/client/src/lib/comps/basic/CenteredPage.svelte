<script lang="ts">
  type WidthOption = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  
  let { children, width = '4xl' }: { 
    children?: any;
    width?: WidthOption;
  } = $props();

  // Explicit mapping to ensure Tailwind includes these classes
  const widthClasses: Record<WidthOption, string> = {
    'sm': 'max-w-sm',
    'md': 'max-w-md', 
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl'
  };
</script>

<div class="mx-auto {widthClasses[width]} px-4 py-2">
  {@render children?.()}
</div>