import { englishTexts } from "./englishTexts";
import { russianTexts } from "./ai-generated/russianTexts";
import { turkishTexts } from "./ai-generated/turkishTexts";
import { chineseTexts } from "./ai-generated/chineseTexts";
import type { Texts } from "./texts";

export const SUPPORTED_LANGUAGES = ["en", "zh", "ru", "tr"] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: "English",
  zh: "Chinese / 中文",
  ru: "Russian / Русский",
  tr: "Turkish / Türkçe"
};

export function createTexts(lang: SupportedLanguage = "en"): Texts {
  switch (lang) {
    case "ru":
      return russianTexts;
    case "tr":
      return turkishTexts;
    case "zh":
      return chineseTexts;
    default:
      return englishTexts;
  }
}