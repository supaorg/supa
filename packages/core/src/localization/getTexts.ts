import { englishTexts } from "./englishTexts";
import { russianTexts } from "./ai-generated/russianTexts";
import { turkishTexts } from "./ai-generated/turkishTexts";
import { chineseTexts } from "./ai-generated/chineseTexts";
import { hindiTexts } from "./ai-generated/hindiTexts";
import { spanishTexts } from "./ai-generated/spanishTexts";
import { arabicTexts } from "./ai-generated/arabicTexts";
import { japaneseTexts } from "./ai-generated/japaneseTexts";
import { koreanTexts } from "./ai-generated/koreanTexts";
import type { Texts } from "./texts";

export const SUPPORTED_LANGUAGES = ["ar", "en", "es", "hi", "ja", "ko", "ru", "tr", "zh"] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  ar: "Arabic / العربية",
  en: "English",
  es: "Spanish / Español",
  hi: "Hindi / हिन्दी",
  ja: "Japanese / 日本語",
  ko: "Korean / 한국어",
  ru: "Russian / Русский",
  tr: "Turkish / Türkçe",
  zh: "Chinese / 中文"
};

export function createTexts(lang: SupportedLanguage = "en"): Texts {
  if (lang === "en") {
    return englishTexts;
  }

  const localizedTexts = (() => {
    switch (lang) {
      case "ar":
        return arabicTexts;
      case "es":
        return spanishTexts;
      case "hi":
        return hindiTexts;
      case "ja":
        return japaneseTexts;
      case "ko":
        return koreanTexts;
      case "ru":
        return russianTexts;
      case "tr":
        return turkishTexts;
      case "zh":
        return chineseTexts;
      default:
        return englishTexts;
    }
  })();

  // Use English as base and override with localized texts
  return { ...englishTexts, ...localizedTexts };
}