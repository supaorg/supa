import { createTexts } from "@shared/localization/getTexts";
import type { Texts } from "@shared/localization/texts";
import { writable } from "svelte/store";

// @TODO: implement inserting a target language
export const txtStore = writable<Texts>(createTexts());
