export function getProviderModels(
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
    case "ollama":
      return getProviderModels_ollama();
    case "deepseek":
      return getProviderModels_deepseek(key, signal);
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
    models.filter((model) => model.startsWith("gpt") || model.startsWith("o"))
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

async function getProviderModels_anthropic(key: string, signal?: AbortSignal): Promise<string[]> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/models", {
      method: "GET",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      signal,
    });

    const data = await res.json();

    if (data.error || !data.data) {
      console.error("Anthropic error:", data);
      return [];
    }

    return data.data.map((model: { id: string }) => model.id);
    //return ["claude-3-haiku-20240307", "claude-3-opus-20240229", "claude-3-5-sonnet-20240620", "claude-3-sonnet-20240229"];
  } catch (err) {
    console.error("Fetch error:", err);
    return [];
  }
}

async function getProviderModels_ollama(): Promise<string[]> {
  try {
    const response = await fetch("http://localhost:11434/api/tags");
    const data = await response.json();
    return data.models.map((model: { name: string }) => model.name);
  } catch (err) {
    console.error("Fetch error:", err);
    return [];
  }
}

async function getProviderModels_deepseek(key: string, signal?: AbortSignal): Promise<string[]> {
  try {
    const res = await fetch("https://api.deepseek.com/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${key}`,
      },
      signal,
    });

    const data = await res.json();

    if (!data.data) {
      console.error("DeepSeek error:", data);
      return [];
    }

    return data.data.map((model: { id: string }) => model.id);
  } catch (err) {
    if (err.name === "AbortError") {
      console.log("Fetch aborted");
    } else {
      console.error("Fetch error:", err);
    }
    return [];
  }
}