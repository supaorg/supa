export function getCloudProviderModels(provider: string, key: string, signal?: AbortSignal): Promise<string[]> {
  switch (provider) {
    case "openai":
      return getProviderModels_openai(key, signal);
    case "groq":
      return getProviderModels_groq(key, signal);
    case "anthropic":
      return getProviderModels_anthropic(key, signal);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

function getProviderModels_openai(key: string, signal?: AbortSignal) {
  return getProviderModels_openaiLikeApi("https://api.openai.com/v1", key, signal);
}

function getProviderModels_groq(key: string, signal?: AbortSignal) {
  return getProviderModels_openaiLikeApi("https://api.groq.com/openai/v1", key, signal);
}

async function getProviderModels_openaiLikeApi(
  url: string,
  key: string,
  signal?: AbortSignal,
): Promise<string[]> {
  try {
    return await fetch(url + "/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
      },
      signal,
    }).then((res) => res.json())
      .then((data) => data.data.map((model: { id: string }) => model.id));
  } catch (err) {
    if (err.name === "AbortError") {
      console.log("Fetch aborted");
    } else {
      console.error("Fetch error:", err);
    }

    return [];
  }
}

async function getProviderModels_anthropic(key: string, signal?: AbortSignal) {
  return [];
}
