import { createTexts } from "$lib/localization/getTexts";
import type { Texts } from "$lib/localization/texts";
import { writable } from "svelte/store";

// @TODO: implement inserting a target language
export const txtStore = writable<Texts>(createTexts());
