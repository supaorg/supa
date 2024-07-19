export function getCloudProviderModels(
  provider: string,
  key: string,
  signal?: AbortSignal,
): Promise<string[]> {
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
  const models = getProviderModels_openaiLikeApi(
    "https://api.openai.com/v1",
    key,
    signal,
  );

  // Here we filter out models that don't have "gpt" in their id
  return models.then((models) =>
    models.filter((model) => model.includes("gpt"))
  );
}

function getProviderModels_groq(key: string, signal?: AbortSignal) {
  return getProviderModels_openaiLikeApi(
    "https://api.groq.com/openai/v1",
    key,
    signal,
  );
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

// From: https://docs.anthropic.com/claude/docs/models-overview
async function getProviderModels_anthropic(key: string, signal?: AbortSignal) {
  return ['claude-3-haiku-20240307', 'claude-3-opus-20240229', 'claude-3-5-sonnet-20240620', 'claude-3-sonnet-20240229'];
}
