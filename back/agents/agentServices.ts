import {
  Lang,
  LangVecs,
  PromptForObject,
} from "https://deno.land/x/aiwrapper@v0.0.17/mod.ts";
import { LanguageModel } from "https://deno.land/x/aiwrapper@v0.0.17/src/lang/language-model.ts";
import { AppDb } from "../db/appDb.ts";

export class AgentServices {
  readonly db: AppDb;

  constructor(db: AppDb) {
    this.db = db;
  }

  lang(model: string): LanguageModel {
    const modelSplit = model.split("/");
    if (modelSplit.length !== 2) {
      throw new Error("Invalid model name");
    }

    const modelProvider = modelSplit[0];
    const modelName = modelSplit[1];

    switch (modelProvider) {
      case "openai":
        return Lang.openai({
          apiKey: this.db.getSecret('key_openai'),
          model: modelName,
        });
      case "groq":
        return Lang.groq({
          apiKey: this.db.getSecret('key_groq'),
          model: modelName,
        })
      case "anthropic":
        return Lang.anthropic({
          apiKey: this.db.getSecret('key_anthropic'),
          model: modelName,
        });
      case "ollama":
        return Lang.ollama({
          'url': 'none'
        });
      default:
        throw new Error("Invalid model provider");
    }
  }
}
