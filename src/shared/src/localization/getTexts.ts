import { englishTexts } from "./languages/englishTexts";
import type { Texts } from "./texts";

export function createTexts(language?: Partial<Texts>): Texts {
  return {
    ...englishTexts,
    // Override with the provided language
    ...language
  }
}