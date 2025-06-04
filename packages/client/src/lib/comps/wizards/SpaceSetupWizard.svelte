<script lang="ts">
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import { theme, setThemeName } from "$lib/stores/theme.svelte";
  import ModelProviders from "$lib/comps/models/ModelProviders.svelte";
  import Lightswitch from "$lib/comps/basic/Lightswitch.svelte";
  import { goto } from "$app/navigation";
  import { providers } from "@core/providers";
  import { Check, ChevronLeft, ChevronRight } from "lucide-svelte";
  
  // Step management
  let currentStep = $state(0);
  const totalSteps = 3;
  
  // Step 1: Space name
  let spaceName = $state("");
  let spaceNameError = $state("");
  
  // Preset space names
  const presetNames = [
    "Personal",
    "Work",
    "Studies",
    "School"
  ];
  
  // Step 2: Model providers
  let hasSetupProvider = $state(false);
  
  // Step 3: Theme
  let selectedTheme = $state(theme.themeName);
  
  // Available themes
  let themes = [
    { name: "catppuccin", emoji: "🐈" },
    { name: "cerberus", emoji: "🐺" },
    { name: "concord", emoji: "🤖" },
    { name: "crimson", emoji: "🔴" },
    { name: "fennec", emoji: "🦊" },
    { name: "hamlindigo", emoji: "👔" },
    { name: "mint", emoji: "🍃" },
    { name: "modern", emoji: "🌸" },
    { name: "rocket", emoji: "🚀" },
    { name: "rose", emoji: "🌷" },
    { name: "seafoam", emoji: "🧜‍♀️" },
    { name: "vintage", emoji: "📺" },
  ];
  
  // Check if the current space has any model providers configured
  $effect(() => {
    if (spaceStore.currentSpace) {
      const providerVertex = spaceStore.currentSpace.tree.getVertexByPath("providers");
      if (providerVertex) {
        hasSetupProvider = providerVertex.children.length > 0;
      }
    }
  });
  
  // Handle provider setup
  function handleProviderConnect() {
    hasSetupProvider = true;
  }
  
  // Handle theme selection
  async function handleThemeClick(name: string) {
    selectedTheme = name;
    await setThemeName(name);
  }
  
  // Navigation functions
  function nextStep() {
    if (currentStep === 0) {
      // Allow empty space name (skip naming)
      if (!spaceName.trim()) {
        spaceName = "My Space"; // Default name if skipped
      }
      
      // Save space name
      if (spaceStore.currentSpace) {
        const updatedPointers = spaceStore.pointers.map((space) =>
          space.id === spaceStore.currentSpaceId ? { ...space, name: spaceName } : space
        );
        spaceStore.pointers = updatedPointers;
        
        // Also update the loaded space name
        const currentPointer = spaceStore.pointers.find(p => p.id === spaceStore.currentSpaceId);
        if (currentPointer) {
          const space = spaceStore.getLoadedSpaceFromPointer(currentPointer);
          if (space) {
            space.name = spaceName;
          }
        }
      }
      
      spaceNameError = "";
    }
    
    if (currentStep < totalSteps - 1) {
      currentStep++;
    } else {
      completeSetup();
    }
  }
  
  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
    }
  }
  
  function completeSetup() {
    // Apply final settings
    if (spaceStore.currentSpace) {
      // Set onboarding to false to indicate setup is complete
      const rootVertex = spaceStore.currentSpace.rootVertex;
      spaceStore.currentSpace.tree.setVertexProperty(rootVertex.id, 'onboarding', false);
    }
  }
</script>

<div class="w-full max-w-3xl mx-auto p-4">
  <!-- Progress indicator -->
  <div class="flex justify-between mb-8">
    {#each Array(totalSteps) as _, i}
      <div 
        class="flex flex-col items-center" 
        class:opacity-50={i !== currentStep}
      >
        <div 
          class="w-10 h-10 rounded-full flex items-center justify-center mb-2 {i === currentStep ? 'bg-primary-500' : i < currentStep ? 'bg-success-500' : 'bg-surface-300-600-token'}"
        >
          {#if i < currentStep}
            <Check size={20} />
          {:else}
            <span>{i + 1}</span>
          {/if}
        </div>
        <span class="text-sm">
          {i === 0 ? 'Name' : i === 1 ? 'Provider' : 'Theme'}
        </span>
      </div>
      
      {#if i < totalSteps - 1}
        <div class="flex-1 flex items-center">
          <div class="h-0.5 w-full bg-surface-300-600-token"></div>
        </div>
      {/if}
    {/each}
  </div>
  
  <!-- Step content -->
  <div class="card p-6 border-[1px] border-surface-200-800">
    {#if currentStep === 0}
      <!-- Step 1: Space Name -->
      <h2 class="h3 mb-4">Name your space</h2>
      <p class="mb-4">Give your space a name to help you identify it, or skip to continue with a default name. You can always change it later.</p>
      
      <div class="form-control w-full mb-4">
        <label class="label" for="spaceName">
          <span class="label-text">Space name</span>
        </label>
        <input
          id="spaceName"
          type="text"
          placeholder="Space"
          class="input {spaceNameError ? 'input-error' : ''}"
          bind:value={spaceName}
        />
        {#if spaceNameError}
          <p class="text-error-500 text-sm mt-1">{spaceNameError}</p>
        {/if}
      </div>
      
      <div class="mb-6">
        <p class="text-sm mb-2">You can give a simple name that describes the purpose of the space:</p>
        <div class="flex flex-wrap gap-2">
          {#each presetNames as name}
            <button 
              class="btn btn-sm preset-outlined"
              class:preset-filled={name.toLocaleLowerCase() === spaceName.toLocaleLowerCase()} 
              onclick={() => spaceName = name}
            >
              {name}
            </button>
          {/each}
        </div>
      </div>
    {:else if currentStep === 1}
      <!-- Step 2: Model Provider -->
      <h2 class="h3 mb-4">Setup AI model provider</h2>
      <p class="mb-4">
        Connect at least one AI model provider to start using Supa. We recommend
        setting up OpenAI, Anthropic or DeepSeek first.
      </p>
      
      {#if hasSetupProvider}
        <div class="alert variant-filled-success mb-4">
          <Check size={18} />
          <span>You've successfully set up a model provider!</span>
        </div>
      {/if}
      
      <div class="max-h-[400px] overflow-y-auto pr-2">
        <ModelProviders onConnect={handleProviderConnect} />
      </div>
    {:else}
      <!-- Step 3: Theme -->
      <h2 class="h3 mb-4">Choose your theme</h2>
      <p class="mb-4">Select a theme and color scheme for your space.</p>
      
      <div class="mb-4">
        <label class="label">
          <span>Color scheme</span>
          <Lightswitch />
        </label>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2">
        {#each themes as skeletonTheme}
          <button
            data-theme={skeletonTheme.name}
            class="w-full bg-surface-50-950 p-2 preset-outlined-surface-100-900 rounded-md grid grid-cols-[auto_1fr_auto] items-center gap-4 {selectedTheme === skeletonTheme.name ? 'border-2 border-primary-500' : 'border-2 border-transparent'}"
            onclick={() => handleThemeClick(skeletonTheme.name)}
            aria-pressed={selectedTheme === skeletonTheme.name}
          >
            <span>{skeletonTheme.emoji}</span>
            <h3 class="text-lg capitalize text-left">{skeletonTheme.name}</h3>
            <div class="flex justify-center items-center -space-x-1">
              <div class="aspect-square w-4 bg-primary-500 border-[1px] border-black/10 rounded-full"></div>
              <div class="aspect-square w-4 bg-secondary-500 border-[1px] border-black/10 rounded-full"></div>
              <div class="aspect-square w-4 bg-tertiary-500 border-[1px] border-black/10 rounded-full"></div>
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
  
  <!-- Navigation buttons -->
  <div class="flex justify-between mt-6">
    <button 
      class="btn preset-outlined" 
      onclick={prevStep}
      disabled={currentStep === 0}
    >
      <ChevronLeft size={16} />
      Back
    </button>
    
    <button 
      class="btn preset-filled" 
      onclick={nextStep}
      disabled={currentStep === 1 && !hasSetupProvider}
    >
      {currentStep < totalSteps - 1 ? 'Next' : 'Finish'}
      {#if currentStep < totalSteps - 1}
        <ChevronRight size={16} />
      {/if}
    </button>
  </div>
</div>