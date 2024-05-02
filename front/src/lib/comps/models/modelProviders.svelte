<script lang="ts">
  import type { ModelProvider } from "@shared/models";
  import ModelProviderCard from "./ModelProviderCard.svelte";

  const providers: ModelProvider[] = [
    {
      id: "openai",
      name: "OpenAI",
      access: "cloud",
      url: "https://openai.com/",
      logoUrl: "/providers/openai.png",
    },
    {
      id: "groq",
      name: "Groq",
      access: "cloud",
      url: "https://groq.com/",
      logoUrl: "/providers/groq.png",
    },
    {
      id: "anthropic",
      name: "Anthropic",
      access: "cloud",
      url: "https://anthropic.com/",
      logoUrl: "/providers/anthropic.png",
    },
    {
      id: "ollama",
      name: "Ollama",
      access: "local",
      url: "https://ollama.com/",
      logoUrl: "/providers/ollama.png",
    },
  ];
</script>

<div class="grid grid-cols-2 gap-4">
  {#each providers as provider (provider.id)}
    <ModelProviderCard {provider} />
  {/each}
</div>
