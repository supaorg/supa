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
      ...await Promise.all(messages.map(async (m) => {
        // Validate and normalize the role - only allow "assistant" or "user"
        let normalizedRole = (m.role || "user");
        if (normalizedRole !== "assistant" && normalizedRole !== "user") {
          normalizedRole = "user";
        }

        const hasAttachments = Array.isArray((m as any).attachments) && (m as any).attachments.length > 0;
        if (!hasAttachments) {
          return {
            role: normalizedRole as "assistant" | "user",
            content: m.text || "",
          } as LangChatMessage;
        }

        const attachments = (m as any).attachments as Array<any>;
        const images = attachments.filter(a => a?.kind === 'image' && typeof a?.dataUrl === 'string' && a.dataUrl.trim() !== '');
        const textFiles = attachments.filter(a => a?.kind === 'text' && a?.file?.tree && a?.file?.vertex);

        // Handle vision-capable models with images
        if (supportsVision && images.length > 0) {
          const parts: LangContentPart[] = [];
          
          // Add text content first
          if (m.text && m.text.trim().length > 0) {
            parts.push({ type: 'text', text: m.text });
          }
          
          // Add text file contents (need to load from CAS)
          for (const textFile of textFiles) {
            const fileContent = await this.loadTextFileContent(textFile.file.tree, textFile.file.vertex);
            if (fileContent) {
              const fileHeader = `\n\n--- File: ${textFile.name} (${textFile.alt || 'text'}) ---\n`;
              parts.push({ type: 'text', text: fileHeader + fileContent });
            }
          }
          
          // Add images
          for (const img of images) {
            const { base64, mimeType } = parseDataUrl(img.dataUrl as string);
            parts.push({ type: 'image', image: { kind: 'base64', base64, mimeType } });
          }
          
          return { role: normalizedRole as "assistant" | "user", content: parts } as LangChatMessage;
        }

        // Handle non-vision models or text-only attachments
        let content = m.text || "";
        
        // Add text file contents (need to load from CAS)
        for (const textFile of textFiles) {
          const fileContent = await this.loadTextFileContent(textFile.file.tree, textFile.file.vertex);
          if (fileContent) {
            const fileHeader = `\n\n--- File: ${textFile.name} (${textFile.alt || 'text'}, ${textFile.width || 'unknown'} lines) ---\n`;
            content += fileHeader + fileContent;
          }
        }
        
        // Add image descriptions for non-vision models
        if (images.length > 0) {
          const names = images.map((a) => a.name).filter(Boolean).join(', ');
          content += `\n\n[User attached ${images.length} image(s): ${names}]`;
        }
        
        return {
          role: normalizedRole as "assistant" | "user",
          content: content,
        } as LangChatMessage;
      })),
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

  // Helper function to load text file content from CAS
  private async loadTextFileContent(treeId: string, vertexId: string): Promise<string | null> {
    try {
      // Load the file vertex to get the hash
      const appTree = await this.services.space.loadAppTree(treeId);
      if (!appTree) return null;
      
      const fileVertex = appTree.tree.getVertex(vertexId);
      if (!fileVertex) return null;
      
      const hash = fileVertex.getProperty("hash") as string;
      if (!hash) return null;

      // Load the file content from CAS
      const store = this.services.space.getFileStore();
      if (!store) return null;
      
      const fileData = await store.getData(hash);
      if (!fileData) return null;
      
      // Convert to text
      return new TextDecoder().decode(fileData);
    } catch (error) {
      console.warn('Failed to load text file content:', error);
      return null;
    }
  }
}
