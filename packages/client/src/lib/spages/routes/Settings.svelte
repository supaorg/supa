<script lang="ts">
  import Lightswitch from "$lib/comps/basic/Lightswitch.svelte";
  import ModelProviders from "$lib/comps/models/ModelProviders.svelte";
  import { spaceStore } from "$lib/spaces/spaceStore.svelte";
  import { isDevMode } from "$lib/stores/devMode";
  import { currentLanguage } from "$lib/stores/txtStore";
  import {
    SUPPORTED_LANGUAGES,
    LANGUAGE_NAMES,
  } from "@core/localization/getTexts";
  import { txtStore } from "$lib/stores/txtStore";
  import { openSpaces } from "$lib/spages";
  import ThemeSwitcher from "$lib/comps/themes/ThemeSwitcher.svelte";
</script>

<div>
  <!--<h2 class="h2 mb-4">{$txtStore.settingsPage.title}</h2>-->

  <div class="flex flex-col gap-6 w-full">
    <div class="card p-4 border-[1px] border-surface-200-800">
      <h3 class="h4 mb-4">{$txtStore.settingsPage.appearance.language}</h3>
      <div class="space-y-4">
        <select bind:value={$currentLanguage} class="select">
          {#each SUPPORTED_LANGUAGES as lang}
            <option value={lang}>{LANGUAGE_NAMES[lang]}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="card p-4 border-[1px] border-surface-200-800">
      <h3 class="h4 mb-4">{$txtStore.settingsPage.appearance.title}</h3>
      <div class="space-y-4">
        <label class="label">
          <span>Color scheme</span>
          <Lightswitch />
        </label>

        <label class="label">
          <span>Theme</span>
          <ThemeSwitcher />
        </label>
      </div>
    </div>

    <div class="card p-4 border-[1px] border-surface-200-800">
      <h3 class="h4 mb-4">{$txtStore.settingsPage.providers.title}</h3>
      <ModelProviders />
    </div>

    <div class="card p-4 border-[1px] border-surface-200-800">
      <h3 class="h4 mb-4">{$txtStore.settingsPage.spaces.title}</h3>
      <p class="mb-4">
        {$txtStore.settingsPage.spaces.spaceCount(
          spaceStore.connections.length
        )}
      </p>
      <button class="btn preset-filled" onclick={() => openSpaces()}>
        {$txtStore.settingsPage.spaces.manageButton}
      </button>
    </div>

    <div class="card p-4 border-[1px] border-surface-200-800">
      <h3 class="h4 mb-4">{$txtStore.settingsPage.developers.title}</h3>
      <button
        class="btn preset-filled"
        onclick={() => ($isDevMode = !$isDevMode)}
        >{$txtStore.settingsPage.developers.toggleDevMode}</button
      >
    </div>
  </div>
</div>
