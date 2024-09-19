import { ModelProvider } from "@shared/models.ts";

export const providers: ModelProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    access: "cloud",
    url: "https://openai.com/",
    logoUrl: "/providers/openai.png",
    defaultModel: "gpt-4o"
  },
  {
    id: "groq",
    name: "Groq",
    access: "cloud",
    url: "https://groq.com/",
    logoUrl: "/providers/groq.png",
    defaultModel: "llama-3.1-70b-versatile"
  },
  {
    id: "anthropic",
    name: "Anthropic",
    access: "cloud",
    url: "https://anthropic.com/",
    logoUrl: "/providers/anthropic.png",
    defaultModel: "claude-3-5-sonnet-20240620"
  },
  {
    id: "ollama",
    name: "Ollama",
    access: "local",
    url: "https://ollama.com/",
    logoUrl: "/providers/ollama.png",
  },
];
