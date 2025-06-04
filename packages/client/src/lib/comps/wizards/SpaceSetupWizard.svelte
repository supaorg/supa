<script lang="ts">
  import Wizard from "$lib/comps/wizards/Wizard.svelte";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import { theme, setThemeName } from "$lib/stores/theme.svelte";
  import ModelProviders from "$lib/comps/models/ModelProviders.svelte";
  import Lightswitch from "$lib/comps/basic/Lightswitch.svelte";
  import { Check } from "lucide-svelte";
  import { onMount } from "svelte";
  import ThemeSwitcher from "../themes/ThemeSwitcher.svelte";

  let spaceName = $state("");
  let spaceNameError = $state(""); // Kept for potential future use, though Wizard handles its own validation display
  let hasSetupProvider = $state(false);
  let selectedTheme = $state(theme.themeName);

  const presetNames = [
    "Personal",
    "Work",
    "Studies",
    "School"
  ];

  const wizardSteps = [
    "name",
    "provider",
    "theme"
  ];

  const wizardTitles = [
    "Name",
    "Brains",
    "Theme"
  ];

  let currentWizardStep = $state(0);

  $effect(() => {
    if (spaceStore.currentSpace) {
      const providerVertex = spaceStore.currentSpace.tree.getVertexByPath("providers");
      if (providerVertex) {
        hasSetupProvider = providerVertex.children.length > 0;
      }
    }
  });

  onMount(() => {
    spaceName = spaceStore.currentSpace?.name || presetNames[0];
  });

  function handleProviderConnect() {
    hasSetupProvider = true;
  }

  async function handleThemeClick(name: string) {
    selectedTheme = name;
    await setThemeName(name);
  }

  function handleStepChange(newStep: number) {
    currentWizardStep = newStep;
    if (newStep === 1) { // Moving from step 0 (Name) to step 1 (Provider)
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
      spaceNameError = ""; // Clear any previous error
    }
  }

  function completeSetup() {
    if (spaceStore.currentSpace) {
      const rootVertex = spaceStore.currentSpace.rootVertex;
      spaceStore.currentSpace.tree.setVertexProperty(rootVertex.id, 'onboarding', false);
      // Potentially navigate away or show a success message
    }
  }

  let canAdvance = $derived.by(() => {
    if (currentWizardStep === 1 && !hasSetupProvider) {
      return false;
    }
    return true;
  });

</script>

<Wizard 
  steps={wizardSteps} 
  titles={wizardTitles} 
  onComplete={completeSetup} 
  onStepChange={handleStepChange}
  canAdvance={canAdvance}
  bind:step={currentWizardStep}
>
  {#snippet children({ currentStep }: { currentStep: number })} 
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
          placeholder="My Space"
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
      <h2 class="h3 mb-4">Setup brains for your space</h2>
      <p class="mb-4">
        Connect at least one AI model provider to start using Supa. We recommend
        setting up OpenAI, Anthropic or DeepSeek first.
      </p>
      
      <div class="overflow-y-auto pr-2">
        <ModelProviders onConnect={handleProviderConnect} />
      </div>
    {:else if currentStep === 2}
      <!-- Step 3: Theme -->
      <h2 class="h3 mb-4">Choose the look of your space</h2>      
      <div class="mb-4 space-y-4">
        <label class="label">
          <span>Color scheme</span>
          <Lightswitch />
        </label>

        <label class="label">
          <span>Theme</span>
          <ThemeSwitcher />
        </label>
      </div>
    {/if}
  {/snippet}
</Wizard>