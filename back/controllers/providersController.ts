import { ModelProvider } from "../../shared/models.ts";
import { ModelProviderCloudConfig } from "../../shared/models.ts";
import { ModelProviderConfig } from "../../shared/models.ts";
import { validateKey } from "../tools/providerKeyValidators.ts";
import { getCloudProviderModels } from "../tools/providerModels.ts";
import { BackServices } from "./backServices.ts";

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

export function providersController(services: BackServices) {
  const router = services.router;

  router
    .onGet("providers", (ctx) => {
      ctx.response = providers;
    })
    .onGet("providers/:providerId", (ctx) => {
      const providerId = ctx.params.providerId;

      const provider = providers.find((p) => p.id === providerId);

      if (provider === undefined) {
        ctx.error = "Provider not found";
        return;
      }

      ctx.response = provider;
    })
    .onGet("provider-configs/:providerId", async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      const providerId = ctx.params.providerId;

      const provider = await services.db.getProviderConfig(providerId);

      if (provider === null) {
        ctx.error = "Provider not found";
        return;
      }

      ctx.response = provider;
    })
    .onPost("provider-configs/:providerId/validate", async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      const providerId = ctx.params.providerId;

      const provider = await services.db.getProviderConfig(providerId);

      if (provider === null) {
        ctx.response = false;
        return;
      }

      if (provider.type === "cloud") {
        const cloudConfig = provider as ModelProviderCloudConfig;
        const keyIsValid = await validateKey(providerId, cloudConfig.apiKey);

        ctx.response = keyIsValid;
      } else {
        // @TODO: check if the endpoint is alive
        ctx.response = true;
      }
    })
    .onGet("provider-configs/:providerId/models", async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      const providerId = ctx.params.providerId;

      const provider = await services.db.getProviderConfig(providerId);

      if (provider === null) {
        ctx.error = "Provider not found";
        return;
      }

      if (provider.type !== "cloud") {
        ctx.data = [];
        return;
      }

      const models = await getCloudProviderModels(providerId, provider.apiKey);

      ctx.response = models;
    })
    .onGet("provider-configs", async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      const providers = await services.db.getModelProviders();

      ctx.response = providers;
    })
    .onPost("provider-configs", async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      const provider = ctx.data as ModelProviderConfig;

      const newProvider = await services.db.insertProviderConfig(provider);

      ctx.response = newProvider;

      router.broadcast(ctx.route, newProvider);
    })
    .onDelete("provider-configs/:providerId", async (ctx) => {
      if (services.db === null) {
        ctx.error = services.getDbNotSetupError();
        return;
      }

      const providerId = ctx.params.providerId;

      const provider = await services.db.getProviderConfig(providerId);

      if (provider === null) {
        ctx.error = "Provider not found";
        return;
      }

      await services.db.deleteProviderConfig(providerId);

      ctx.response = true;

      router.broadcast(ctx.route, provider);
    })
    .onPost("validate-key/:provider", async (ctx) => {
      const provider = ctx.params.provider;
      const key = ctx.data as string;
      const keyIsValid = await validateKey(provider, key);
      ctx.response = keyIsValid;
    });
}
