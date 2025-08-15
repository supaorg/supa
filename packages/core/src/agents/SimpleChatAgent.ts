import type { LangChatMessage, LangContentPart } from "aiwrapper";
import { AppConfig, ThreadMessage } from "../models";
import { Agent, AgentInput, AgentOutput } from "./Agent";

export interface AppConfigForChat extends AppConfig {
  targetLLM?: string;
}

export class SimpleChatAgent extends Agent<AppConfigForChat> {
  hasStopped = false;

  async input(
    payload: AgentInput,
    onStream?: (output: AgentOutput) => void,
  ): Promise<AgentOutput> {
    this.hasStopped = false;
    const messages = payload as ThreadMessage[];

    const lang = await this.services.lang(this.config.targetLLM);
    const resolvedModel = this.services.getLastResolvedModel();

    // @TODO: move this to localized texts file
    let systemPrompt = this.config.instructions + "\n\n" +
      "Preferably use markdown for formatting. If you write code examples: use tick marks for inline code and triple tick marks for code blocks." +
      "\n\n" +
      "For math, use TeX with inline $ ... $ and block $$ ... $$ delimiters. If you want to show the source of TeX - wrap it in a code block" +
      "\n\n" +
      "Current date and time " + new Date().toLocaleString();

    // Add meta info to the system prompt to give the assistant context
    if (resolvedModel) {
      systemPrompt += `\n\n[Meta] Model: ${resolvedModel.provider}/${resolvedModel.model}`;
    }
    if (this.config.name) {
      systemPrompt += `\n[Meta] Assistant Config: ${this.config.name}`;
    }

    /*
    const profile = await this.services.db.getProfile();
    if (profile) {
      systemPrompt += "\n\nUser's name is " + profile?.name;
    }
    */

    // @TODO: add meta data to messages with the current date, model, config name, etc

    const supportsVision = (() => {
      if (!resolvedModel) return false;
      const p = resolvedModel.provider;
      // Simple allowlist for Phase 1; will switch to Lang.models capabilities later
      return p === "openai" || p === "openrouter" || p === "google" || p === "xai" || p === "anthropic";
    })();

    function parseDataUrl(dataUrl: string): { base64: string; mimeType?: string } {
      try {
        const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
        if (match && match[2]) {
          return { mimeType: match[1], base64: match[2] };
        }
      } catch {}
      // If it's already just base64 without prefix
      return { base64: dataUrl };
    }

    const remappedMessages: LangChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => {
        // Validate and normalize the role - only allow "assistant" or "user"
        let normalizedRole = (m.role || "user");
        if (normalizedRole !== "assistant" && normalizedRole !== "user") {
          normalizedRole = "user";
        }

        const hasImages = Array.isArray((m as any).attachments) && (m as any).attachments.length > 0;
        if (!hasImages) {
          return {
            role: normalizedRole as "assistant" | "user",
            content: m.text || "",
          } as LangChatMessage;
        }

        const images = ((m as any).attachments as Array<any>).filter(a => a?.kind === 'image' && typeof a?.dataUrl === 'string');
        if (supportsVision && images.length > 0) {
          const parts: LangContentPart[] = [];
          if (m.text && m.text.trim().length > 0) {
            parts.push({ type: 'text', text: m.text });
          }
          for (const img of images) {
            const { base64, mimeType } = parseDataUrl(img.dataUrl as string);
            parts.push({ type: 'image', image: { kind: 'base64', base64, mimeType } });
          }
          return { role: normalizedRole as "assistant" | "user", content: parts } as LangChatMessage;
        }

        // Fallback: models without vision get a descriptive text instead of binary
        const names = images.map((a) => a.name).filter(Boolean).join(', ');
        const note = `\n\n[User attached ${images.length} image(s): ${names}]`;
        return {
          role: normalizedRole as "assistant" | "user",
          content: (m.text || "") + note,
        } as LangChatMessage;
      }),
    ];

    const finalResult = await lang.chat(remappedMessages, {
      onResult: (res: any) => {
        if (this.hasStopped) {
          return;
        }

        onStream?.({
          text: res.answer,
          thinking: (res as any).thinking,
        });
      },
    });

    return {
      text: finalResult.answer,
      thinking: (finalResult as any).thinking
    };
  }

  stop(): void {
    this.hasStopped = true;
  }
}
