import { createTexts, type SupportedLanguage } from "@shared/localization/getTexts";
import type { Texts } from "@shared/localization/texts";
import { persisted } from "svelte-persisted-store";
import { derived } from "svelte/store";

export const currentLanguage = persisted<SupportedLanguage>("language", "en");

export const txtStore = derived(currentLanguage, ($lang) => createTexts($lang));
