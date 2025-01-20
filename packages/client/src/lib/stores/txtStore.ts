import { createTexts, type SupportedLanguage } from "@core/localization/getTexts";
import type { Texts } from "@core/localization/texts";
import { persisted } from "svelte-persisted-store";
import { derived } from "svelte/store";

export const currentLanguage = persisted<SupportedLanguage>("language", "en");

export const txtStore = derived(currentLanguage, ($lang) => createTexts($lang));
